/**
 * Bexio OpenID Connect: authorization code flow (PKCE) and background token refresh.
 *
 * A "connection" is one Bexio user login stored under a label (e.g. "backoffice").
 * After the one-time browser consent, access tokens are refreshed automatically:
 * on demand shortly before they expire, and by a periodic job so the offline
 * session never hits Bexio's 1-year idle timeout. Bexio rotates refresh tokens,
 * so every new refresh token is persisted before the access token is used.
 *
 * Token endpoint handling adapted from asig/bexio-mcp-server
 * (bexio-oauth-bridge/src/bexio-oauth.ts, MIT).
 */

import { BexioClient } from "../bexio-client.js";
import { logger } from "../logger.js";
import { pkceChallenge, pkceVerifier, randomToken } from "./crypto.js";
import type { ConnectionStore, StoredConnection } from "./token-store.js";

export const DEFAULT_ISSUER = "https://auth.bexio.com/realms/bexio";

export const DEFAULT_SCOPES = [
  "openid",
  "profile",
  "email",
  "company_profile",
  "offline_access",
  "accounting",
  "article_edit",
  "bank_account_show",
  "bank_payment_edit",
  "contact_edit",
  "file",
  "kb_invoice_edit",
  "kb_offer_edit",
  "kb_order_edit",
  "kb_delivery_edit",
  "kb_article_order_edit",
  "kb_bill_show",
  "kb_expense_show",
  "monitoring_edit",
  "note_edit",
  "project_edit",
  "stock_edit",
  "task_edit",
  "payroll_employee_show",
  "payroll_absence_show",
  "payroll_paystub_show",
];

export const LABEL_PATTERN = /^[a-z0-9][a-z0-9_-]{0,39}$/;

export interface OidcConfig {
  clientId: string;
  clientSecret: string;
  issuer: string;
  redirectUri: string;
  scopes: string[];
}

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  id_token?: string;
}

/** The refresh token was revoked or expired; a person has to reconnect. */
export class ReconnectRequiredError extends Error {
  constructor(label: string, detail?: string) {
    super(
      `Bexio connection "${label}" must be reconnected by an admin (${detail ?? "authorization revoked"}).`
    );
    this.name = "ReconnectRequiredError";
  }
}

interface PendingAuthorization {
  label: string;
  verifier: string;
  createdAt: number;
}

const PENDING_TTL_MS = 10 * 60 * 1000;
const EXPIRY_SKEW_MS = 60 * 1000;

export interface ConnectionManagerOptions {
  store: ConnectionStore;
  oidc: OidcConfig;
  bexioBaseUrl: string;
  /** Refresh every connection at least this often (default 24h). */
  keepAliveIntervalMs?: number;
  fetchImpl?: typeof fetch;
  now?: () => number;
}

export class ConnectionManager {
  private readonly store: ConnectionStore;
  private readonly oidc: OidcConfig;
  private readonly bexioBaseUrl: string;
  private readonly keepAliveIntervalMs: number;
  private readonly fetchImpl: typeof fetch;
  private readonly now: () => number;
  private readonly pending = new Map<string, PendingAuthorization>();
  private readonly inflight = new Map<string, Promise<StoredConnection>>();
  private readonly clients = new Map<string, BexioClient>();
  private timer: NodeJS.Timeout | undefined;

  constructor(options: ConnectionManagerOptions) {
    this.store = options.store;
    this.oidc = options.oidc;
    this.bexioBaseUrl = options.bexioBaseUrl;
    this.keepAliveIntervalMs = options.keepAliveIntervalMs ?? 24 * 60 * 60 * 1000;
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.now = options.now ?? Date.now;
  }

  // ===== Authorization code flow =====

  /** Returns the Bexio login URL for a new (or renewed) connection. */
  startAuthorization(label: string): string {
    if (!LABEL_PATTERN.test(label)) {
      throw new Error("Connection label must be 1-40 characters: lowercase letters, digits, '-' or '_'.");
    }
    this.prunePending();
    const state = randomToken(24);
    const verifier = pkceVerifier();
    this.pending.set(state, { label, verifier, createdAt: this.now() });

    const url = new URL(`${this.oidc.issuer}/protocol/openid-connect/auth`);
    url.searchParams.set("client_id", this.oidc.clientId);
    url.searchParams.set("redirect_uri", this.oidc.redirectUri);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", this.oidc.scopes.join(" "));
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", pkceChallenge(verifier));
    url.searchParams.set("code_challenge_method", "S256");
    return url.toString();
  }

  /** Handles the redirect back from Bexio and stores the connection. */
  async completeAuthorization(state: string, code: string): Promise<StoredConnection> {
    this.prunePending();
    const pending = this.pending.get(state);
    if (!pending) {
      throw new Error("Unknown or expired login attempt. Please start the connection again.");
    }
    this.pending.delete(state);

    const tokens = await this.tokenRequest({
      grant_type: "authorization_code",
      code,
      redirect_uri: this.oidc.redirectUri,
      code_verifier: pending.verifier,
    });
    if (!tokens.refresh_token) {
      throw new Error("Bexio returned no refresh token. Make sure the scope offline_access is requested.");
    }

    const claims = decodeJwtClaims(tokens.id_token);
    const now = this.now();
    const connection: StoredConnection = {
      label: pending.label,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      accessTokenExpiresAt: now + (tokens.expires_in ?? 300) * 1000,
      scope: tokens.scope,
      companyName: stringClaim(claims, "company_name"),
      companyId: stringClaim(claims, "company_id"),
      userEmail: stringClaim(claims, "email"),
      connectedAt: now,
      lastRefreshAt: now,
      status: "active",
    };
    this.store.upsert(connection);
    logger.info(`Bexio connection "${connection.label}" established${connection.companyName ? ` (${connection.companyName})` : ""}.`);
    return connection;
  }

  // ===== Tokens =====

  /** Current access token, refreshed transparently when it is about to expire. */
  async getAccessToken(label: string): Promise<string> {
    const connection = this.requireConnection(label);
    if (connection.accessTokenExpiresAt - EXPIRY_SKEW_MS > this.now()) {
      return connection.accessToken;
    }
    return (await this.refresh(label)).accessToken;
  }

  /**
   * Refresh a connection. Concurrent callers share one in-flight request, because
   * Bexio rotates refresh tokens: two parallel refreshes would invalidate each other.
   */
  refresh(label: string): Promise<StoredConnection> {
    const existing = this.inflight.get(label);
    if (existing) return existing;
    const promise = this.doRefresh(label).finally(() => this.inflight.delete(label));
    this.inflight.set(label, promise);
    return promise;
  }

  private async doRefresh(label: string): Promise<StoredConnection> {
    const connection = this.requireConnection(label);
    let tokens: TokenResponse;
    try {
      tokens = await this.tokenRequest({
        grant_type: "refresh_token",
        refresh_token: connection.refreshToken,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (error instanceof InvalidGrantError) {
        this.store.upsert({ ...connection, status: "reconnect_required", lastError: message });
        logger.error(`Bexio connection "${label}" was revoked or expired; an admin must reconnect it.`);
        throw new ReconnectRequiredError(label, message);
      }
      this.store.upsert({ ...connection, lastError: message });
      throw error;
    }

    const now = this.now();
    const updated: StoredConnection = {
      ...connection,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? connection.refreshToken,
      accessTokenExpiresAt: now + (tokens.expires_in ?? 300) * 1000,
      scope: tokens.scope ?? connection.scope,
      lastRefreshAt: now,
      status: "active",
      lastError: undefined,
    };
    this.store.upsert(updated);
    logger.debug(`Bexio connection "${label}" refreshed.`);
    return updated;
  }

  /** Refresh every active connection that has not been refreshed within the keep-alive interval. */
  async keepAlive(): Promise<void> {
    for (const connection of this.store.list()) {
      if (connection.status !== "active") continue;
      if (this.now() - connection.lastRefreshAt < this.keepAliveIntervalMs) continue;
      try {
        await this.refresh(connection.label);
        logger.info(`Bexio connection "${connection.label}" kept alive.`);
      } catch (error) {
        logger.error(
          `Keep-alive refresh for "${connection.label}" failed:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  }

  startBackgroundRefresh(checkEveryMs = 60 * 60 * 1000): void {
    this.stopBackgroundRefresh();
    void this.keepAlive();
    this.timer = setInterval(() => void this.keepAlive(), checkEveryMs);
    this.timer.unref();
  }

  stopBackgroundRefresh(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  // ===== Connections =====

  list(): StoredConnection[] {
    return this.store.list();
  }

  has(label: string): boolean {
    return this.store.get(label) !== undefined;
  }

  remove(label: string): boolean {
    this.clients.delete(label);
    return this.store.remove(label);
  }

  /** One BexioClient per connection, shared by all sessions mapped to it. */
  getClient(label: string): BexioClient {
    let client = this.clients.get(label);
    if (!client) {
      client = new BexioClient({
        baseUrl: this.bexioBaseUrl,
        getToken: () => this.getAccessToken(label),
        onUnauthorized: async () => {
          await this.refresh(label);
        },
      });
      this.clients.set(label, client);
    }
    return client;
  }

  private requireConnection(label: string): StoredConnection {
    const connection = this.store.get(label);
    if (!connection) {
      throw new Error(`Bexio connection "${label}" is not set up. An admin must connect it first.`);
    }
    if (connection.status === "reconnect_required") {
      throw new ReconnectRequiredError(label, connection.lastError);
    }
    return connection;
  }

  private prunePending(): void {
    const cutoff = this.now() - PENDING_TTL_MS;
    for (const [state, pending] of this.pending) {
      if (pending.createdAt < cutoff) this.pending.delete(state);
    }
  }

  private async tokenRequest(params: Record<string, string>): Promise<TokenResponse> {
    const body = new URLSearchParams({
      ...params,
      client_id: this.oidc.clientId,
      client_secret: this.oidc.clientSecret,
    });
    const res = await this.fetchImpl(`${this.oidc.issuer}/protocol/openid-connect/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body,
    });
    const text = await res.text();
    if (!res.ok) {
      let errorCode: string | undefined;
      let description: string | undefined;
      try {
        const json = JSON.parse(text) as { error?: string; error_description?: string };
        errorCode = json.error;
        description = json.error_description;
      } catch {
        // non-JSON error body
      }
      const message = `Bexio token endpoint returned ${res.status}${errorCode ? ` ${errorCode}` : ""}${description ? `: ${description}` : ""}`;
      if (errorCode === "invalid_grant") throw new InvalidGrantError(message);
      throw new Error(message);
    }
    const json = JSON.parse(text) as TokenResponse;
    if (!json.access_token) throw new Error("Bexio token endpoint returned no access_token");
    return json;
  }
}

class InvalidGrantError extends Error {}

/** Decode JWT claims without verification; only used for display metadata from a token we just received over TLS. */
function decodeJwtClaims(jwt: string | undefined): Record<string, unknown> {
  if (!jwt) return {};
  const part = jwt.split(".")[1];
  if (!part) return {};
  try {
    return JSON.parse(Buffer.from(part, "base64url").toString("utf8")) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function stringClaim(claims: Record<string, unknown>, key: string): string | undefined {
  const value = claims[key];
  if (typeof value === "string" && value) return value;
  if (typeof value === "number") return String(value);
  return undefined;
}
