import { describe, it, expect } from "vitest";
import { z } from "zod";
import { BexioClient } from "./bexio-client.js";
import { jsonSchemaToZodShape } from "./schema-converter.js";
import { getAllToolDefinitions } from "./tools/index.js";
import { handlers as noteHandlers } from "./tools/notes/handlers.js";
import { handlers as purchaseHandlers } from "./tools/purchase/handlers.js";

/** Parse args the way the SDK does: through the zod shape derived from the tool's inputSchema. */
function sdkArgs(tool: string, args: Record<string, unknown>) {
  const def = getAllToolDefinitions().find((t) => t.name === tool)!;
  return z.object(jsonSchemaToZodShape(def.inputSchema)).parse(args);
}

describe("create_note", () => {
  // bexio's POST /note answers 422 "Unexpected extra form field named is_public". A schema
  // default made the SDK inject is_public into every call, so no note could be created.
  it("does not send is_public unless the caller sets it", async () => {
    const client = new BexioClient({ apiToken: "test" } as never);
    let sent: Record<string, unknown> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client as any).makeRequest = async (_m: string, _e: string, _p: unknown, body: Record<string, unknown>) => {
      sent = body;
      return {};
    };
    await noteHandlers.create_note(client, sdkArgs("create_note", {
      user_id: 1, event_start: "2025-07-04 00:00:00", subject: "Ratenplan", contact_id: 8,
    }));
    expect(sent).not.toHaveProperty("is_public");
    expect(sent).toMatchObject({ user_id: 1, subject: "Ratenplan", contact_id: 8 });
  });
});

describe("revert_bill_to_draft", () => {
  it("PUTs the bill back to DRAFT via the v4 bookings endpoint", async () => {
    const client = new BexioClient({ apiToken: "test" } as never);
    const calls: Array<[string, string, string]> = [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (client as any).makeVersionedRequest = async (version: string, method: string, endpoint: string) => {
      calls.push([version, method, endpoint]);
      return {};
    };
    await purchaseHandlers.revert_bill_to_draft(client, sdkArgs("revert_bill_to_draft", { bill_id: "abc" }));
    expect(calls).toEqual([["4.0", "PUT", "purchase/bills/abc/bookings/DRAFT"]]);
  });
});
