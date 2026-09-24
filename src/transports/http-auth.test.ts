import { describe, it, expect, afterEach, vi } from "vitest";
import type { FastifyInstance } from "fastify";
import { createHttpServer } from "./http.js";
import * as log from "../logger.js";

/**
 * HTTP mode serves every bexio tool. Without authentication, anyone who can reach
 * the port - and, through the permissive CORS policy, any web page open in the
 * user's browser - can read and write the company's books. BEXIO_HTTP_TOKEN turns
 * on bearer auth; without it the server still starts (non-breaking) but says loudly
 * what is exposed.
 */
const TOKEN = "s3cret-token-for-tests-0123456789";
const LIST = { jsonrpc: "2.0", id: 1, method: "tools/list" };
let app: FastifyInstance | undefined;

afterEach(async () => {
  await app?.close();
  app = undefined;
  vi.restoreAllMocks();
});

describe("HTTP bearer auth (BEXIO_HTTP_TOKEN)", () => {
  it("rejects calls without the token, accepts the right one", async () => {
    app = await createHttpServer({ host: "127.0.0.1", port: 0, authToken: TOKEN });
    const none = await app.inject({ method: "POST", url: "/mcp", payload: LIST });
    const wrong = await app.inject({
      method: "POST",
      url: "/mcp",
      payload: LIST,
      headers: { authorization: "Bearer not-the-token" },
    });
    const right = await app.inject({
      method: "POST",
      url: "/mcp",
      payload: LIST,
      headers: { authorization: `Bearer ${TOKEN}` },
    });
    expect(none.statusCode).toBe(401);
    expect(wrong.statusCode).toBe(401);
    expect(right.statusCode).toBe(200);
    expect(right.json().result.tools.length).toBeGreaterThan(100);
  });

  it.each([
    ["POST", "/tools/call", { name: "ping" }],
    ["POST", "/n8n/call", { tool: "ping" }],
    ["GET", "/tools", undefined],
  ] as const)("protects %s %s", async (method, url, payload) => {
    app = await createHttpServer({ host: "127.0.0.1", port: 0, authToken: TOKEN });
    const res = await app.inject({ method, url, payload });
    expect(res.statusCode).toBe(401);
  });

  it("leaves the health check and CORS preflight open", async () => {
    app = await createHttpServer({ host: "127.0.0.1", port: 0, authToken: TOKEN });
    expect((await app.inject({ method: "GET", url: "/" })).statusCode).toBe(200);
    const preflight = await app.inject({
      method: "OPTIONS",
      url: "/mcp",
      headers: { origin: "https://n8n.example", "access-control-request-method": "POST" },
    });
    expect(preflight.statusCode).toBe(204);
  });

  it("without a token, behaves as before (no auth) but warns", async () => {
    const warn = vi.spyOn(log.logger, "warn");
    app = await createHttpServer({ host: "0.0.0.0", port: 0 });
    const res = await app.inject({ method: "POST", url: "/mcp", payload: LIST });
    expect(res.statusCode).toBe(200);
    expect(warn.mock.calls.flat().join(" ")).toMatch(/BEXIO_HTTP_TOKEN/);
  });
});
