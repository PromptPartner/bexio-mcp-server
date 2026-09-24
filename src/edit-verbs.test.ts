import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { BexioClient } from "./bexio-client.js";

/**
 * bexio's 2.0 API edits with POST ("Edit an invoice", "Edit an item", ...). Its OpenAPI
 * spec documents no PUT on any of these paths. PUT either fails with an empty 422
 * (kb_invoice, #19) or, where bexio still accepts it as an undocumented *overwrite*,
 * returns 200 and clears every field absent from the payload (article: edit_item
 * wiped prices, codes and taxes). POST is the documented partial edit.
 */
function recordingClient() {
  const client = new BexioClient({ apiToken: "test" } as never);
  const calls: Array<{ method: string; endpoint: string }> = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (client as any).makeRequest = async (method: string, endpoint: string) => {
    calls.push({ method, endpoint });
    return {};
  };
  return { client, calls };
}

const EDITS: Array<[string, (c: BexioClient) => Promise<unknown>, string]> = [
  ["updateContactGroup", (c) => c.updateContactGroup(3, { name: "x" }), "/contact_group/3"],
  ["updateSalutation", (c) => c.updateSalutation(3, { name: "x" }), "/salutation/3"],
  ["updateTitle", (c) => c.updateTitle(3, { name: "x" }), "/title/3"],
  ["editOrder", (c) => c.editOrder(3, { title: "x" }), "/kb_order/3"],
  ["editQuote", (c) => c.editQuote(3, { title: "x" }), "/kb_offer/3"],
  ["editInvoice", (c) => c.editInvoice(3, { title: "x" }), "/kb_invoice/3"],
  ["editItem", (c) => c.editItem(3, { article_group_id: 2 }), "/article/3"],
  ["updateAdditionalAddress", (c) => c.updateAdditionalAddress(3, 4, { name: "x" }), "/contact/3/additional_address/4"],
  ["updateNote", (c) => c.updateNote(3, { subject: "x" }), "/note/3"],
];

describe("2.0 edits use POST (the documented partial edit), never PUT", () => {
  it.each(EDITS)("%s", async (_name, call, endpoint) => {
    const { client, calls } = recordingClient();
    await call(client);
    expect(calls).toEqual([{ method: "POST", endpoint }]);
  });

  it("no 2.0 request in BexioClient uses PUT", () => {
    // Guard against re-introducing the bug in a new method: v2.0 goes through
    // makeRequest (v3.0/v4.0 through makeVersionedRequest, where PUT is valid).
    const src = readFileSync(fileURLToPath(new URL("./bexio-client.ts", import.meta.url)), "utf-8");
    expect(src.match(/makeRequest(<[^>]*>)?\(\s*"PUT"/g) ?? []).toEqual([]);
  });
});
