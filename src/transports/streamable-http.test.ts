import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import type { FastifyInstance } from "fastify";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { ConnectionManager } from "../auth/bexio-oidc.js";
import { ClientRegistry, generateClientKey, hashClientKey } from "../auth/client-config.js";
import { parseEncryptionKey } from "../auth/crypto.js";
import { ConnectionStore } from "../auth/token-store.js";
import { createGatewayServer } from "./streamable-http.js";

const ADMIN_KEY = "admin-key-0123456789";
const annaKey = generateClientKey();
const benKey = generateClientKey();

let dir: string;
let gateway: FastifyInstance;
let bexioApi: http.Server;
let baseUrl: string;
const seenAuthHeaders: string[] = [];
let tokenRequests = 0;

beforeAll(async () => {
  // Fake Bexio API: accepts only the "fresh" access token, answers 401 otherwise.
  bexioApi = http.createServer((req, res) => {
    seenAuthHeaders.push(String(req.headers.authorization));
    res.setHeader("Content-Type", "application/json");
    if (req.headers.authorization !== "Bearer at-fresh") {
      res.statusCode = 401;
      res.end(JSON.stringify({ message: "invalid token" }));
      return;
    }
    res.end(JSON.stringify([{ id: 1, name_1: "Monswyk AG" }]));
  });
  await new Promise<void>((resolve) => bexioApi.listen(0, "127.0.0.1", resolve));
  const apiPort = (bexioApi.address() as AddressInfo).port;

  dir = fs.mkdtempSync(path.join(os.tmpdir(), "bmg-gw-"));
  const store = new ConnectionStore(path.join(dir, "connections.enc"), parseEncryptionKey("d".repeat(64)));
  store.upsert({
    label: "backoffice",
    accessToken: "at-stale",
    refreshToken: "rt-1",
    accessTokenExpiresAt: Date.now() + 3_600_000,
    connectedAt: Date.now(),
    lastRefreshAt: Date.now(),
    status: "active",
  });

  const connections = new ConnectionManager({
    store,
    bexioBaseUrl: `http://127.0.0.1:${apiPort}/2.0`,
    oidc: {
      clientId: "id",
      clientSecret: "secret",
      issuer: "https://auth.example.test/realms/bexio",
      redirectUri: "https://gw.example.test/oauth/callback",
      scopes: ["openid", "offline_access"],
    },
    fetchImpl: (async () => {
      tokenRequests++;
      return new Response(JSON.stringify({ access_token: "at-fresh", refresh_token: "rt-2", expires_in: 300 }));
    }) as unknown as typeof fetch,
  });

  const clientsFile = path.join(dir, "clients.json");
  fs.writeFileSync(
    clientsFile,
    JSON.stringify({
      anna: { keyHash: hashClientKey(annaKey), connection: "backoffice" },
      ben: { keyHash: hashClientKey(benKey), connection: "backoffice" },
    })
  );

  gateway = await createGatewayServer({
    host: "127.0.0.1",
    port: 0,
    publicBaseUrl: "https://gw.example.test",
    adminKey: ADMIN_KEY,
    connections,
    clients: new ClientRegistry(clientsFile),
    sessionTtlMs: 60_000,
  });
  baseUrl = `http://127.0.0.1:${(gateway.server.address() as AddressInfo).port}`;
});

afterAll(async () => {
  await gateway?.close();
  await new Promise<void>((resolve) => bexioApi?.close(() => resolve()));
  fs.rmSync(dir, { recursive: true, force: true });
});

async function connectClient(key: string) {
  const transport = new StreamableHTTPClientTransport(new URL(`${baseUrl}/mcp`), {
    requestInit: { headers: { Authorization: `Bearer ${key}` } },
  });
  const client = new Client({ name: "test", version: "1.0.0" });
  await client.connect(transport);
  return { client, transport };
}

describe("gateway transport", () => {
  it("rejects requests without a valid key", async () => {
    const res = await fetch(`${baseUrl}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }),
    });
    expect(res.status).toBe(401);
    expect(res.headers.get("www-authenticate")).toContain("Bearer");

    await expect(connectClient("bmg_wrong")).rejects.toThrow();
  });

  it("serves tools over Streamable HTTP and uses the connection's OAuth token", async () => {
    const { client } = await connectClient(annaKey);
    const tools = await client.listTools();
    expect(tools.tools.length).toBeGreaterThan(100);
    expect(tools.tools.some((t) => t.name === "select_company")).toBe(false);

    const result = await client.callTool({ name: "list_contacts", arguments: {} });
    expect(result.isError).toBeFalsy();
    expect(JSON.stringify(result.content)).toContain("Monswyk AG");

    // The stale token got a 401, the gateway refreshed once and retried with the new token.
    expect(seenAuthHeaders).toEqual(["Bearer at-stale", "Bearer at-fresh"]);
    expect(tokenRequests).toBe(1);
    await client.close();
  });

  it("does not let one client use another client's session", async () => {
    const { client, transport } = await connectClient(annaKey);
    const res = await fetch(`${baseUrl}/mcp`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json, text/event-stream",
        Authorization: `Bearer ${benKey}`,
        "Mcp-Session-Id": transport.sessionId!,
        "Mcp-Protocol-Version": "2025-06-18",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 5, method: "tools/list", params: {} }),
    });
    expect(res.status).toBe(403);
    await client.close();
  });

  it("protects the admin page and reports health", async () => {
    expect((await fetch(`${baseUrl}/admin`)).status).toBe(401);
    const ok = await fetch(`${baseUrl}/admin`, {
      headers: { Authorization: `Basic ${Buffer.from(`admin:${ADMIN_KEY}`).toString("base64")}` },
    });
    expect(ok.status).toBe(200);
    const html = await ok.text();
    expect(html).toContain("backoffice");
    expect(html).toContain("anna");
    expect(html).not.toContain("rt-");

    const health = await fetch(`${baseUrl}/health`);
    expect(await health.json()).toEqual({ status: "ok" });
  });
});
