import { describe, it, expect } from "vitest";
import { mergeBillData } from "./merge.js";

// A realistic GET /4.0/purchase/bills/{id} response shape (trimmed), including the
// computed/denormalized fields that the PUT endpoint rejects as "Unrecognized
// property" (id, status, firstname_suffix, lastname_company, created_at,
// pending_amount, overdue, base_currency_code).
const currentBill = {
  id: "uuid-123",
  status: "DRAFT",
  document_no: "00013",
  title: "Original title",
  supplier_id: 1,
  contact_partner_id: 3,
  currency_code: "CHF",
  bill_date: "2026-06-30",
  due_date: "2026-07-30",
  manual_amount: false,
  amount_calc: 100,
  item_net: true,
  split_into_line_items: false,
  address: { lastname_company: "bexio AG", type: "COMPANY", city: "Zug", postcode: "6300", country_code: "CH" },
  line_items: [{ amount: 100, position: 0, title: "line", tax_id: 8, booking_account_id: 160 }],
  // computed / read-only fields PUT rejects:
  firstname_suffix: null,
  lastname_company: "bexio AG",
  created_at: "2026-06-30T12:00:00+00:00",
  pending_amount: 100,
  overdue: false,
  base_currency_code: "CHF",
};

describe("mergeBillData", () => {
  it("preserves document_no when the patch does not touch it (the #7 bug)", () => {
    const out = mergeBillData(currentBill, { title: "New title" });
    expect(out.document_no).toBe("00013");
    expect(out.title).toBe("New title");
  });

  it("drops computed/read-only fields the PUT endpoint rejects", () => {
    const out = mergeBillData(currentBill, { title: "x" });
    expect(out).not.toHaveProperty("id");
    expect(out).not.toHaveProperty("status");
    expect(out).not.toHaveProperty("created_at");
    expect(out).not.toHaveProperty("pending_amount");
    expect(out).not.toHaveProperty("overdue");
    expect(out).not.toHaveProperty("base_currency_code");
    // top-level denormalized firstname_suffix/lastname_company are NOT writable here
    expect(out).not.toHaveProperty("firstname_suffix");
    expect(out).not.toHaveProperty("lastname_company");
  });

  it("keeps the required writable fields needed for a valid PUT", () => {
    const out = mergeBillData(currentBill, { title: "x" });
    expect(out.supplier_id).toBe(1);
    expect(out.contact_partner_id).toBe(3);
    expect(out.amount_calc).toBe(100);
    expect(out.split_into_line_items).toBe(false);
    expect(out.currency_code).toBe("CHF");
  });

  it("replaces the line_items array wholesale (not element-merged)", () => {
    const out = mergeBillData(currentBill, {
      line_items: [{ amount: 50, position: 0, tax_id: 8, booking_account_id: 160 }],
    });
    expect(out.line_items).toHaveLength(1);
    expect((out.line_items as any[])[0].amount).toBe(50);
    expect((out.line_items as any[])[0].title).toBeUndefined(); // old line not merged in
  });

  it("reduces line items to writable subfields only", () => {
    const out = mergeBillData(currentBill, {
      line_items: [{ amount: 50, position: 0, tax_id: 8, booking_account_id: 160, id: "li-1", tax_value: 7.7 }],
    });
    const li = (out.line_items as any[])[0];
    expect(li).not.toHaveProperty("id");
    expect(li).not.toHaveProperty("tax_value");
    expect(li.amount).toBe(50);
  });

  it("deep-merges the address object and reduces it to writable subfields", () => {
    const out = mergeBillData(currentBill, { address: { city: "Bern" } });
    const addr = out.address as Record<string, unknown>;
    expect(addr.city).toBe("Bern"); // patched
    expect(addr.postcode).toBe("6300"); // preserved from current
    expect(addr.lastname_company).toBe("bexio AG"); // preserved
  });
});
