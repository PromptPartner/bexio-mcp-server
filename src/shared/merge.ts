/**
 * #7: read-modify-write merge for update_bill.
 *
 * Bexio's v4 `PUT /4.0/purchase/bills/{id}` both (a) rejects the full GET body
 * ("Unrecognized property: id", …) and (b) silently drops any writable field the
 * caller omits — most damagingly `document_no`, whose loss then breaks booking.
 * So a safe partial update must GET the current bill, deep-merge the caller's
 * patch over it, and PUT back ONLY the writable fields (an allowlist) — carrying
 * `document_no` through. The exact writable field set was confirmed by live probe
 * (see scripts/PROBE-FINDINGS.md).
 */

/** Writable top-level bill fields accepted by PUT (computed/denormalized fields excluded). */
export const BILL_WRITABLE_FIELDS = [
  "supplier_id", "contact_partner_id", "address", "bill_date", "due_date",
  "line_items", "title", "manual_amount", "amount_man", "amount_calc",
  "currency_code", "exchange_rate", "base_currency_amount", "item_net",
  "purchase_order_id", "qr_bill_information", "attachment_ids", "discounts",
  "vendor_ref", "average_exchange_rate_enabled", "split_into_line_items",
  "document_no",
] as const;

/** Writable sub-fields of the bill `address` object (BillAddress). */
export const BILL_ADDRESS_WRITABLE_FIELDS = [
  "lastname_company", "type", "title", "salutation", "firstname_suffix",
  "address_line", "postcode", "city", "country_code", "main_contact_id",
  "contact_address_id",
] as const;

/** Writable sub-fields of each `line_items` entry (BillLineItem). */
export const BILL_LINE_ITEM_WRITABLE_FIELDS = [
  "amount", "position", "title", "tax_id", "booking_account_id",
] as const;

type Obj = Record<string, unknown>;

const isPlainObject = (v: unknown): v is Obj =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Deep-merge `patch` over `current`. Objects merge recursively; arrays and
 * scalars in `patch` REPLACE the corresponding value wholesale. */
function deepMerge(current: Obj, patch: Obj): Obj {
  const out: Obj = { ...current };
  for (const [k, v] of Object.entries(patch)) {
    if (isPlainObject(v) && isPlainObject(out[k])) {
      out[k] = deepMerge(out[k] as Obj, v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

/** Keep only `fields` whose value is present (non-null/undefined). */
function pick(obj: Obj, fields: readonly string[]): Obj {
  const out: Obj = {};
  for (const f of fields) {
    if (obj[f] !== undefined && obj[f] !== null) out[f] = obj[f];
  }
  return out;
}

/**
 * Merge a caller `patch` over the `current` bill (from GET) and return a body
 * suitable for PUT: writable fields only, `document_no` preserved, nested
 * `address` and `line_items` reduced to their writable sub-fields. The
 * `line_items` array is replaced wholesale by any array present in `patch`.
 */
export function mergeBillData(current: Obj, patch: Obj): Obj {
  const merged = deepMerge(current ?? {}, patch ?? {});
  const out = pick(merged, BILL_WRITABLE_FIELDS);
  if (isPlainObject(merged["address"])) {
    out["address"] = pick(merged["address"], BILL_ADDRESS_WRITABLE_FIELDS);
  }
  if (Array.isArray(merged["line_items"])) {
    out["line_items"] = (merged["line_items"] as unknown[]).map((li) =>
      isPlainObject(li) ? pick(li, BILL_LINE_ITEM_WRITABLE_FIELDS) : li
    );
  }
  return out;
}
