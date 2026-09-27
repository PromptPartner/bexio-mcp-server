import { describe, it, expect, beforeAll } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { companyManager } from "./company-manager.js";
import { BexioMcpServer } from "./server.js";

/**
 * Anthropic's directory requires every tool to carry a title and a readOnlyHint or
 * destructiveHint, and hosts use them to decide what to confirm. The definitions had
 * the hints, but server.ts registered tools with server.tool(name, desc, shape, cb),
 * which drops them: tools/list advertised no annotations at all (checked on 2.6.0).
 * This checks what a client actually receives.
 */
let tools: Array<{ name: string; title?: string; annotations?: Record<string, unknown> }>;

beforeAll(async () => {
  companyManager.init({ baseUrl: "https://api.bexio.com/2.0", tokens: [{ label: "default", token: "test" }] } as never);
  const server = new BexioMcpServer();
  server.initialize();
  const [clientT, serverT] = InMemoryTransport.createLinkedPair();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (server as any).server.connect(serverT);
  const client = new Client({ name: "annotations-test", version: "1" });
  await client.connect(clientT);
  tools = (await client.listTools()).tools as typeof tools;
});

describe("tools/list advertises annotations", () => {
  it("lists every tool", () => {
    expect(tools.length).toBeGreaterThan(300);
  });

  it("every tool has a title", () => {
    expect(tools.filter((t) => !(t.title || t.annotations?.["title"])).map((t) => t.name)).toEqual([]);
  });

  it("every tool has readOnlyHint or destructiveHint", () => {
    const missing = tools.filter(
      (t) => t.annotations?.["readOnlyHint"] === undefined && t.annotations?.["destructiveHint"] === undefined
    );
    expect(missing.map((t) => t.name)).toEqual([]);
  });

  it("keeps the hints from the definitions", () => {
    const byName = Object.fromEntries(tools.map((t) => [t.name, t]));
    expect(byName["delete_invoice"].annotations?.["destructiveHint"]).toBe(true);
    expect(byName["list_invoices"].annotations?.["readOnlyHint"]).toBe(true);
    expect(byName["ping"].annotations?.["readOnlyHint"]).toBe(true);
  });
});
