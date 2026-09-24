import { describe, it, expect } from "vitest";
import { handlers } from "./handlers.js";

/**
 * edit_invoice reads the invoice and re-sends its writable fields with the caller's
 * changes on top. bexio's edit form rejects esr_id and qr_invoice_id ("Widget schema
 * does not include the following field(s): esr_id, qr_invoice_id", #19), so they must
 * not be carried over from the GET response.
 */
const EXISTING = {
  id: 724,
  contact_id: 12,
  user_id: 1,
  title: "Old title",
  reference: "OLD",
  mwst_type: 0,
  mwst_is_net: true,
  esr_id: 5,
  qr_invoice_id: 6,
  total: "100.00",
  kb_item_status_id: 7,
};

function captureClient() {
  const sent: Array<{ id: number; payload: Record<string, unknown> }> = [];
  const client = {
    getInvoice: async () => EXISTING,
    editInvoice: async (id: number, payload: Record<string, unknown>) => {
      sent.push({ id, payload });
      return { id };
    },
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { client: client as any, sent };
}

describe("edit_invoice", () => {
  it("does not carry esr_id / qr_invoice_id into the edit payload", async () => {
    const { client, sent } = captureClient();
    await handlers.edit_invoice(client, { invoice_id: 724, invoice_data: { reference: "TEST" } });
    expect(sent[0].payload).not.toHaveProperty("esr_id");
    expect(sent[0].payload).not.toHaveProperty("qr_invoice_id");
  });

  it("keeps the existing writable fields and applies the caller's changes on top", async () => {
    const { client, sent } = captureClient();
    await handlers.edit_invoice(client, { invoice_id: 724, invoice_data: { reference: "TEST" } });
    expect(sent[0]).toMatchObject({
      id: 724,
      payload: { contact_id: 12, user_id: 1, title: "Old title", reference: "TEST", mwst_type: 0 },
    });
    // read-only fields from the GET response stay out
    expect(sent[0].payload).not.toHaveProperty("total");
    expect(sent[0].payload).not.toHaveProperty("kb_item_status_id");
  });
});
