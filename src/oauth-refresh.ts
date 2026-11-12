/**
 * OAuth access-token refresh.
 *
 * The server authenticates with a bearer token. A Personal Access Token is
 * static, so nothing here applies to it. An OAuth access token is not: bexio
 * issues it for one hour, after which every call returns 401 and the operator
 * has to run the authorization flow again by hand.
 *
 * That matters beyond convenience. A PAT "has all default scopes granted and
 * therefore has full access to your company's data" — there is no way to
 * restrict one. Scopes exist only on the OAuth path, so an operator who wants
 * the token itself limited to, say, `kb_invoice_edit` and `contact_edit` has
 * to use OAuth. Without refresh, that choice costs an interactive browser
 * round trip every hour, which in practice means nobody makes it.
 *
 * Enable by pointing BEXIO_OAUTH_TOKEN_FILE at a JSON file holding
 * `{ "access_token": "...", "refresh_token": "..." }` and setting
 * BEXIO_OAUTH_CLIENT_ID / BEXIO_OAUTH_CLIENT_SECRET. The file is read at
 * startup for the current access token, and rewritten (mode 600) after each
 * refresh so the next process starts from a live token.
 */

import { readFileSync, writeFileSync, chmodSync, existsSync } from "node:fs";
import { logger } from "./logger.js";

const DEFAULT_TOKEN_URL =
  "https://auth.bexio.com/realms/bexio/protocol/openid-connect/token";

interface StoredTokens {
  access_token: string;
  refresh_token: string;
  [key: string]: unknown;
}

const tokenFile = process.env["BEXIO_OAUTH_TOKEN_FILE"]?.trim();
const clientId = process.env["BEXIO_OAUTH_CLIENT_ID"]?.trim();
const clientSecret = process.env["BEXIO_OAUTH_CLIENT_SECRET"]?.trim();
const tokenUrl = process.env["BEXIO_OAUTH_TOKEN_URL"]?.trim() || DEFAULT_TOKEN_URL;

/** True when every piece needed to refresh is configured. */
export function refreshConfigured(): boolean {
  return Boolean(tokenFile && clientId && clientSecret);
}

function read(): StoredTokens | null {
  if (!tokenFile || !existsSync(tokenFile)) return null;
  try {
    const parsed = JSON.parse(readFileSync(tokenFile, "utf8")) as StoredTokens;
    if (!parsed.access_token) return null;
    return parsed;
  } catch (err) {
    logger.error(
      `BEXIO_OAUTH_TOKEN_FILE could not be read as JSON (${tokenFile}): ${(err as Error).message}`
    );
    return null;
  }
}

/** The access token on disk, for use at startup in place of BEXIO_API_TOKEN. */
export function storedAccessToken(): string | undefined {
  return read()?.access_token;
}

// One refresh at a time. Tool calls run in parallel, so a token that expires
// mid-batch produces several 401s at once; without this they would each spend
// the refresh token, and bexio may rotate it — the later exchanges would then
// present one that is no longer current and fail.
let inFlight: Promise<string> | null = null;

/**
 * Exchange the refresh token for a new access token, persist both, and return
 * the new access token. Concurrent callers share one exchange.
 */
export function refreshAccessToken(): Promise<string> {
  if (inFlight) return inFlight;
  inFlight = exchange().finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function exchange(): Promise<string> {
  if (!refreshConfigured()) {
    throw new Error(
      "Access token rejected and no refresh is configured. Set BEXIO_OAUTH_TOKEN_FILE, BEXIO_OAUTH_CLIENT_ID and BEXIO_OAUTH_CLIENT_SECRET, or use a Personal Access Token."
    );
  }
  const stored = read();
  if (!stored?.refresh_token) {
    throw new Error(
      `No refresh_token in ${tokenFile}. Run the authorization flow again, requesting the \`offline_access\` scope.`
    );
  }

  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: stored.refresh_token,
      client_id: clientId as string,
      client_secret: clientSecret as string,
    }),
  });

  if (!res.ok) {
    const detail = (await res.text()).slice(0, 300);
    // An expired or revoked refresh token cannot be recovered from here: say
    // what to do rather than retry something that will keep failing.
    throw new Error(
      `Refreshing the access token failed (${res.status}). The refresh token may be revoked or expired — run the authorization flow again. bexio said: ${detail}`
    );
  }

  const fresh = (await res.json()) as Partial<StoredTokens> & { expires_in?: number };
  if (!fresh.access_token) {
    throw new Error("The token endpoint returned no access_token.");
  }

  // bexio may rotate the refresh token; keep the old one when it does not, or
  // the next refresh has nothing to present.
  const next: StoredTokens = {
    ...stored,
    access_token: fresh.access_token,
    refresh_token: fresh.refresh_token || stored.refresh_token,
  };
  if (fresh.expires_in) {
    next["expires_at"] = new Date(Date.now() + fresh.expires_in * 1000).toISOString();
  }

  try {
    writeFileSync(tokenFile as string, JSON.stringify(next, null, 2) + "\n");
    chmodSync(tokenFile as string, 0o600);
  } catch (err) {
    // The in-memory token is good, so the call that triggered this will
    // succeed; only the next process start would have to refresh again.
    logger.error(
      `Refreshed the access token but could not write ${tokenFile}: ${(err as Error).message}`
    );
  }

  logger.info(
    `Access token refreshed${fresh.expires_in ? ` (valid ${Math.round(fresh.expires_in / 60)} min)` : ""}.`
  );
  return next.access_token;
}
