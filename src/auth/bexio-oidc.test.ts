import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ConnectionManager, ReconnectRequiredError } from "./bexio-oidc.js";
import { parseEncryptionKey } from "./crypto.js";
import { ConnectionStore } from "./token-store.js";

const KEY = parseEncryptionKey("c".repeat(64));
const ISSUER = "https://auth.example.test/realms/bexio";

const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

function jwt(claims: Record<string, unknown>): string {
  return `x.${Buffer.from(JSON.stringify(claims)).toString("base64url")}.y`;
}

interface Call {
  url: string;
  body: URLSearchParams;
}

function setup(responses: Array<{ status: number; body: unknown }>) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bmg-oidc-"));
  dirs.push(dir);
  const store = new ConnectionStore(path.join(dir, "connections.enc"), KEY);
  const calls: Call[] = [];
  let now = 1_000_000;
  const fetchImpl = (async (url: string, init: { body: URLSearchParams }) => {
    calls.push({ url: String(url), body: new URLSearchParams(init.body.toString()) });
    await new Promise((r) => setTimeout(r, 5));
    const next = responses.shift();
    if (!next) throw new Error("unexpected token request");
    return new Response(JSON.stringify(next.body), { status: next.status });
  }) as unknown as typeof fetch;
  const manager = new ConnectionManager({
    store,
    bexioBaseUrl: "https://api.example.test/2.0",
    oidc: {
      clientId: "client-id",
      clientSecret: "client-secret",
      issuer: ISSUER,
      redirectUri: "https://gw.example.test/oauth/callback",
      scopes: ["openid", "offline_access", "contact_show"],
    },
    fetchImpl,
    now: () => now,
  });
  return { manager, store, calls, advance: (ms: number) => (now += ms) };
}

async function connect(manager: ConnectionManager) {
  const url = new URL(manager.startAuthorization("backoffice"));
  expect(url.origin + url.pathname).toBe(`${ISSUER}/protocol/openid-connect/auth`);
  expect(url.searchParams.get("code_challenge_method")).toBe("S256");
  expect(url.searchParams.get("scope")).toBe("openid offline_access contact_show");
  return manager.completeAuthorization(url.searchParams.get("state")!, "auth-code");
}

describe("ConnectionManager", () => {
  it("completes the authorization code flow with PKCE and stores company metadata", async () => {
    const { manager, calls, store } = setup([
      {
        status: 200,
        body: {
          access_token: "at-1",
          refresh_token: "rt-1",
          expires_in: 3600,
          id_token: jwt({ company_name: "Monswyk AG", company_id: "abc", email: "backoffice@monswyk.com" }),
        },
      },
    ]);
    const connection = await connect(manager);

    expect(calls[0]!.body.get("grant_type")).toBe("authorization_code");
    expect(calls[0]!.body.get("code_verifier")).toBeTruthy();
    expect(calls[0]!.body.get("client_secret")).toBe("client-secret");
    expect(connection.companyName).toBe("Monswyk AG");
    expect(connection.userEmail).toBe("backoffice@monswyk.com");
    expect(store.get("backoffice")!.refreshToken).toBe("rt-1");
  });

  it("rejects unknown or reused state", async () => {
    const { manager } = setup([]);
    await expect(manager.completeAuthorization("nope", "code")).rejects.toThrow(/Unknown or expired/);
  });

  it("returns the cached token until shortly before expiry, then refreshes and rotates", async () => {
    const { manager, calls, store, advance } = setup([
      { status: 200, body: { access_token: "at-1", refresh_token: "rt-1", expires_in: 300 } },
      { status: 200, body: { access_token: "at-2", refresh_token: "rt-2", expires_in: 300 } },
    ]);
    await connect(manager);

    expect(await manager.getAccessToken("backoffice")).toBe("at-1");
    expect(calls).toHaveLength(1);

    advance(250_000);
    expect(await manager.getAccessToken("backoffice")).toBe("at-2");
    expect(calls[1]!.body.get("grant_type")).toBe("refresh_token");
    expect(calls[1]!.body.get("refresh_token")).toBe("rt-1");
    expect(store.get("backoffice")!.refreshToken).toBe("rt-2");
  });

  it("shares one refresh between concurrent callers", async () => {
    const { manager, calls, advance } = setup([
      { status: 200, body: { access_token: "at-1", refresh_token: "rt-1", expires_in: 60 } },
      { status: 200, body: { access_token: "at-2", refresh_token: "rt-2", expires_in: 300 } },
    ]);
    await connect(manager);
    advance(1_000);

    const tokens = await Promise.all([1, 2, 3, 4].map(() => manager.getAccessToken("backoffice")));
    expect(tokens).toEqual(["at-2", "at-2", "at-2", "at-2"]);
    expect(calls).toHaveLength(2);
  });

  it("marks the connection for reconnect on invalid_grant", async () => {
    const { manager, store, advance } = setup([
      { status: 200, body: { access_token: "at-1", refresh_token: "rt-1", expires_in: 60 } },
      { status: 400, body: { error: "invalid_grant", error_description: "Token is not active" } },
    ]);
    await connect(manager);
    advance(120_000);

    await expect(manager.getAccessToken("backoffice")).rejects.toBeInstanceOf(ReconnectRequiredError);
    expect(store.get("backoffice")!.status).toBe("reconnect_required");
    await expect(manager.getAccessToken("backoffice")).rejects.toThrow(/must be reconnected/);
  });

  it("keeps the connection active on transient errors", async () => {
    const { manager, store, advance } = setup([
      { status: 200, body: { access_token: "at-1", refresh_token: "rt-1", expires_in: 60 } },
      { status: 503, body: { error: "temporarily_unavailable" } },
    ]);
    await connect(manager);
    advance(120_000);

    await expect(manager.getAccessToken("backoffice")).rejects.toThrow(/503/);
    expect(store.get("backoffice")!.status).toBe("active");
  });

  it("keepAlive refreshes connections older than the interval", async () => {
    const { manager, calls, advance } = setup([
      { status: 200, body: { access_token: "at-1", refresh_token: "rt-1", expires_in: 3600 } },
      { status: 200, body: { access_token: "at-2", refresh_token: "rt-2", expires_in: 3600 } },
    ]);
    await connect(manager);

    await manager.keepAlive();
    expect(calls).toHaveLength(1);

    advance(25 * 60 * 60 * 1000);
    await manager.keepAlive();
    expect(calls).toHaveLength(2);
  });

  it("validates connection labels", () => {
    const { manager } = setup([]);
    expect(() => manager.startAuthorization("Back Office")).toThrow(/label/);
  });
});
