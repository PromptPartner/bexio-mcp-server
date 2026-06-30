#!/usr/bin/env node
/**
 * Phase-0 live probe for the v2.4.1 issue fixes (#6, #7, #8, #9).
 *
 * Discovers the REAL Bexio v4.0 behaviour for the broken bill/payment lifecycle
 * so the fixes target confirmed endpoints/fields instead of guesses. Uses raw
 * axios (BexioClient.makeVersionedRequest is private) with validateStatus:()=>true
 * so every HTTP status is inspected, not thrown.
 *
 * It builds a valid create_bill body ADAPTIVELY: POST, read the validation
 * message, drop "Unrecognized property" keys, fill "must not be null" keys from a
 * guess map, repeat. This converges on the real schema and logs the journey.
 *
 * SAFETY: operates ONLY on records it creates itself (titles prefixed
 * "ZZZ-PROBE-DELETE-ME"), deletes them in a finally block, never mutates
 * pre-existing data. Reads the token from src/.env and NEVER prints it.
 *
 * Run from src/:  node scripts/probe-v4.mjs
 */
import fs from "node:fs";
import axios from "axios";

const token = (fs.readFileSync(".env", "utf8").match(/BEXIO_API_TOKEN=(.+)/) || [])[1]?.trim();
if (!token) {
  console.error("No BEXIO_API_TOKEN in .env");
  process.exit(1);
}

const api = axios.create({
  baseURL: "https://api.bexio.com",
  headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json" },
  validateStatus: () => true,
  timeout: 30000,
});

const TODAY = "2026-06-30";
const DUE = "2026-07-30";
const TAG = "ZZZ-PROBE-DELETE-ME";

const log = (...a) => console.log(...a);
const short = (d, n = 700) => {
  const s = typeof d === "string" ? d : JSON.stringify(d);
  return s && s.length > n ? s.slice(0, n) + " …[truncated]" : s;
};

async function req(method, url, body) {
  try {
    const r = await api.request({ method, url, data: body });
    log(`  ${method} ${url} -> ${r.status}`);
    return r;
  } catch (e) {
    log(`  ${method} ${url} -> NETWORK_ERROR ${e?.message ?? e}`);
    return { status: 0, data: { _network_error: String(e?.message ?? e) } };
  }
}

const createdPayments = [];
const createdBills = [];

async function cleanup() {
  log("\n=== CLEANUP (deleting every record this probe created) ===");
  for (const id of createdPayments) {
    const r = await req("DELETE", `/4.0/purchase/outgoing-payments/${id}`);
    log(`    payment ${id}: ${[200, 204].includes(r.status) ? "DELETED" : "DELETE FAILED " + short(r.data, 200)}`);
  }
  for (const id of createdBills) {
    let r = await req("DELETE", `/4.0/purchase/bills/${id}`);
    if (![200, 204].includes(r.status)) {
      // A booked bill may refuse deletion — revert to DRAFT, then retry.
      log(`    bill ${id}: delete refused (${r.status}); reverting to DRAFT then retrying`);
      await req("PUT", `/4.0/purchase/bills/${id}/bookings/DRAFT`);
      r = await req("DELETE", `/4.0/purchase/bills/${id}`);
    }
    log(`    bill ${id}: ${[200, 204].includes(r.status) ? "DELETED" : "DELETE FAILED " + short(r.data, 200) + "  <-- MANUAL CLEANUP NEEDED"}`);
  }
  log(`  (verify in Bexio UI that no ${TAG} records remain)`);
}

// Remove a key from the top-level object and from any array-of-objects values.
function deleteKeyDeep(obj, key) {
  let changed = false;
  if (key in obj) { delete obj[key]; changed = true; }
  for (const v of Object.values(obj)) {
    if (Array.isArray(v)) for (const el of v) {
      if (el && typeof el === "object" && key in el) { delete el[key]; changed = true; }
    }
  }
  return changed;
}

async function main() {
  // 0. Reference data ---------------------------------------------------------
  log("=== 0. REFERENCE DATA ===");
  const contacts = (await req("GET", "/2.0/contact?limit=50")).data;
  const supplier = Array.isArray(contacts) ? contacts[0] : null;
  const person = Array.isArray(contacts) ? contacts.find((c) => c.contact_type_id === 2) : null;
  log(`  supplier: id=${supplier?.id} name=${supplier?.name_1}`);
  log(`  person contact (for contact_partner_id): id=${person?.id} name=${person?.name_1} ${person?.name_2 ?? ""}`);

  const taxes = (await req("GET", "/3.0/taxes?limit=200")).data;
  const preTax = Array.isArray(taxes)
    ? (taxes.find((t) => t.is_active && /pre_tax_material/i.test(String(t.type))) ||
       taxes.find((t) => t.is_active && /pre_tax/i.test(String(t.type))) ||
       taxes.find((t) => t.is_active))
    : null;
  log(`  tax: id=${preTax?.id} type=${preTax?.type} value=${preTax?.value} name=${preTax?.display_name ?? preTax?.name}`);

  const accounts = (await req("GET", "/2.0/accounts?limit=2000")).data;
  const expense = Array.isArray(accounts)
    ? (accounts.find((a) => a.is_active && !a.is_locked && Number(a.account_no) >= 4000 && Number(a.account_no) < 7000) ||
       accounts.find((a) => a.is_active && !a.is_locked))
    : null;
  log(`  expense account: id=${expense?.id} no=${expense?.account_no} name=${expense?.name}`);

  const banks = (await req("GET", "/3.0/banking/accounts?limit=10")).data;
  const bank = Array.isArray(banks) ? banks[0] : null;
  log(`  bank account: id=${bank?.id} name=${bank?.name}`);

  if (!supplier || !preTax || !expense) {
    log("\n!! Missing reference data — aborting (nothing created).");
    return;
  }

  // 0.5 EXISTING-RECORD SHAPES (read-only — best way to learn the real schema)
  log("\n=== 0.5 EXISTING BILL / PAYMENT SHAPES (read-only) ===");
  const existingBills = (await req("GET", "/4.0/purchase/bills?limit=3")).data;
  if (Array.isArray(existingBills) && existingBills.length) {
    const b = existingBills[0];
    log(`  existing bill keys: ${Object.keys(b).join(", ")}`);
    log(`  FULL bill sample: ${short(b, 1800)}`);
    if (Array.isArray(b.line_items) && b.line_items[0]) {
      log(`  line_item keys: ${Object.keys(b.line_items[0]).join(", ")}`);
      log(`  line_item sample: ${short(b.line_items[0], 500)}`);
    }
    if (b.address !== undefined) log(`  address shape: ${short(b.address, 400)}`);
    log(`  status field value: ${JSON.stringify(b.status)}`);
  } else {
    log("  (no existing bills on this account to learn from)");
  }
  const existingPays = (await req("GET", "/4.0/purchase/outgoing-payments?limit=3")).data;
  if (Array.isArray(existingPays) && existingPays.length) {
    log(`  existing payment keys: ${Object.keys(existingPays[0]).join(", ")}`);
    log(`  payment sample: ${short(existingPays[0], 500)}`);
  } else {
    log("  (no existing outgoing payments to learn from)");
  }

  // 1. #9 — create a valid bill with the schema confirmed from the reference client
  log("\n=== 1. CREATE_BILL (confirmed schema from gigerIT/bexio-api-client) (#9) ===");
  const topGuess = {
    currency_code: "CHF",
    address: {
      lastname_company: supplier.name_1,
      type: "COMPANY",
      address_line: "Teststrasse 1",
      postcode: "6300",
      city: "Zug",
      country_code: "CH",
    },
    item_net: true,
    supplier_id: supplier.id,
    due_date: DUE,
    contact_partner_id: person?.id ?? supplier.id,
    bill_date: TODAY,
    manual_amount: false,
    amount_man: 100,
    amount_calc: 100,
    title: `${TAG} bill`,
  };
  const lineGuess = {
    amount: 100,
    position: 0,
    title: `${TAG} line`,
    tax_id: preTax.id,
    booking_account_id: expense.id,
  };
  const LINE_FIELDS = new Set(["amount", "position", "title", "tax_id", "booking_account_id"]);

  // Seed: confirmed required top-level fields + one valid line item.
  let body = {
    currency_code: "CHF",
    address: topGuess.address,
    item_net: true,
    supplier_id: supplier.id,
    due_date: DUE,
    contact_partner_id: person?.id ?? supplier.id,
    bill_date: TODAY,
    manual_amount: false,
    amount_calc: 100,
    title: `${TAG} bill`,
    line_items: [{ amount: 100, position: 0, title: `${TAG} line`, tax_id: preTax.id, booking_account_id: expense.id }],
  };
  let bill = null;
  for (let i = 0; i < 30; i++) {
    const r = await req("POST", "/4.0/purchase/bills", body);
    if (r.status >= 200 && r.status < 300) {
      bill = r.data;
      createdBills.push(bill.id);
      log(`  ✔ CREATED bill id=${bill.id} after ${i} adjustment(s)`);
      log(`  final body: ${short(body, 800)}`);
      break;
    }
    const msg = String(r.data?.message ?? r.data?._network_error ?? "");
    log(`    iter ${i}: ${r.status} ${short(msg, 300)}`);
    let changed = false;
    for (const m of msg.matchAll(/Unrecognized property:\s*([a-zA-Z0-9_]+)/g)) {
      if (deleteKeyDeep(body, m[1])) { log(`      drop unrecognized '${m[1]}'`); changed = true; }
    }
    for (const m of msg.matchAll(/([a-zA-Z0-9_]+) must not be null/g)) {
      const key = m[1];
      if (LINE_FIELDS.has(key) && Array.isArray(body.line_items)) {
        for (const li of body.line_items) if (!(key in li)) li[key] = lineGuess[key];
        log(`      add line field '${key}'`); changed = true;
      } else if (key in topGuess) {
        body[key] = topGuess[key]; log(`      add top field '${key}'`); changed = true;
      } else {
        log(`      !! no guess for required '${key}'`);
      }
    }
    if (!changed) { log("    (no automatic fix — stopping bill discovery)"); break; }
  }

  if (!bill) { log("\n!! create_bill not solved; see iterations above."); return; }

  log("\n  --- created bill shape ---");
  log(`  keys: ${Object.keys(bill).join(", ")}`);
  for (const k of ["id", "status", "document_no", "title", "is_valid", "kb_item_status_id"]) {
    if (k in bill) log(`    ${k} = ${JSON.stringify(bill[k])}`);
  }

  const id = bill.id;
  const statusOf = async (tag) => {
    const r = await req("GET", `/4.0/purchase/bills/${id}`);
    log(`    [${tag}] status=${JSON.stringify(r.data?.status)} document_no=${JSON.stringify(r.data?.document_no)} title=${JSON.stringify(r.data?.title)}`);
    return r.data;
  };

  // 2. #7 — update_bill while DRAFT: prove the allowlist-sanitized PUT works ---
  log("\n=== 2. UPDATE_BILL (#7) — full-GET PUT fails; allowlist PUT preserves document_no ===");
  // Writable fields confirmed from create schema + gigerIT Bill/BillAddress/BillLineItem DTOs.
  const BILL_WRITABLE = ["supplier_id", "contact_partner_id", "address", "bill_date", "due_date", "line_items", "title", "manual_amount", "amount_man", "amount_calc", "currency_code", "exchange_rate", "base_currency_amount", "item_net", "purchase_order_id", "qr_bill_information", "attachment_ids", "discounts", "vendor_ref", "average_exchange_rate_enabled", "split_into_line_items", "document_no"];
  const ADDR_WRITABLE = ["lastname_company", "type", "title", "salutation", "firstname_suffix", "address_line", "postcode", "city", "country_code", "main_contact_id", "contact_address_id"];
  const LINE_WRITABLE = ["amount", "position", "title", "tax_id", "booking_account_id"];
  const toBillUpdate = (b) => {
    const o = {};
    for (const k of BILL_WRITABLE) if (b[k] !== undefined && b[k] !== null) o[k] = b[k];
    if (b.address && typeof b.address === "object") {
      const a = {}; for (const k of ADDR_WRITABLE) if (b.address[k] != null) a[k] = b.address[k]; o.address = a;
    }
    if (Array.isArray(b.line_items)) o.line_items = b.line_items.map((li) => {
      const x = {}; for (const k of LINE_WRITABLE) if (li[k] != null) x[k] = li[k]; return x;
    });
    return o;
  };
  const getBack = (await req("GET", `/4.0/purchase/bills/${id}`)).data;
  const fullPut = await req("PUT", `/4.0/purchase/bills/${id}`, getBack);
  log(`  naive PUT of full GET body -> ${fullPut.status}: ${short(fullPut.data, 200)} (demonstrates the bug class)`);
  const merged = { ...getBack, title: `${TAG} retitled` };       // user patches ONLY title
  const sanitized = toBillUpdate(merged);
  const goodPut = await req("PUT", `/4.0/purchase/bills/${id}`, sanitized);
  log(`  allowlist PUT (title changed) -> ${goodPut.status}: ${goodPut.status >= 400 ? short(goodPut.data, 300) : "OK"}`);
  const afterUpd = await statusOf("after-allowlist-update");
  log(`  RESULT #7: title updated=${afterUpd?.title === `${TAG} retitled`} document_no preserved=${afterUpd?.document_no === getBack?.document_no}`);

  // 3. #6 — finalize-bill (book) ----------------------------------------------
  log("\n=== 3. FINALIZE-BILL (#6) ===");
  await statusOf("before-finalize");
  log("  -- current (broken) code path issue/mark_as_paid (expect 404):");
  await req("POST", `/4.0/purchase/bills/${id}/issue`);
  await req("POST", `/4.0/purchase/bills/${id}/mark_as_paid`);
  log("  -- CONFIRMED finalize: PUT /4.0/purchase/bills/{id}/bookings/BOOKED (no body):");
  const book = await req("PUT", `/4.0/purchase/bills/${id}/bookings/BOOKED`);
  log(`    -> ${book.status} ${book.status >= 400 ? short(book.data, 300) : "OK"}`);
  await statusOf("after-booking");

  // 4. #6 mark-paid + #8 update-payment + #9 payment naming ------------------
  log("\n=== 4. OUTGOING-PAYMENTS: mark-paid (#6) + update (#8) + naming (#9) ===");
  log(`  empty-body payment POST (lists required fields): ${short((await req("POST", "/4.0/purchase/outgoing-payments", {})).data)}`);
  // Confirmed field names from gigerIT OutgoingPayment DTO: bill_id, payment_type
  // (IBAN|QR|MANUAL), execution_date, amount, sender_bank_account_id, currency_code, ...
  const payGuess = {
    bill_id: id,
    payment_type: "MANUAL",
    execution_date: TODAY,
    amount: 100,
    sender_bank_account_id: bank?.id,
    currency_code: "CHF",
    exchange_rate: 1,
    is_salary_payment: false,
    fee_type: "NO_FEE",
    reference_no: "00 00000 00000 00000 00000 00000",
    message: `${TAG} payment`,
  };
  let payment = null;
  let payBody = { bill_id: id, payment_type: "MANUAL", execution_date: TODAY, amount: 100, currency_code: "CHF", exchange_rate: 1, is_salary_payment: false, sender_bank_account_id: bank?.id };
  for (let i = 0; i < 20; i++) {
    const r = await req("POST", "/4.0/purchase/outgoing-payments", payBody);
    if (r.status >= 200 && r.status < 300) {
      payment = (r.data?.data ?? r.data); createdPayments.push(payment.id);
      log(`  ✔ CREATED payment id=${payment.id} after ${i} adjustment(s); keys: ${Object.keys(payment).join(", ")}`);
      log(`  final payment body: ${short(payBody, 400)}`);
      break;
    }
    const msg = String(r.data?.message ?? "");
    log(`    pay iter ${i}: ${r.status} ${short(msg, 300)}`);
    let changed = false;
    for (const m of msg.matchAll(/Unrecognized property:\s*([a-zA-Z0-9_]+)/g)) {
      if (deleteKeyDeep(payBody, m[1])) { log(`      drop '${m[1]}'`); changed = true; }
    }
    for (const m of msg.matchAll(/([a-zA-Z0-9_]+) must not be null/g)) {
      const key = m[1];
      if (key in payGuess) { payBody[key] = payGuess[key]; log(`      add '${key}'`); changed = true; }
      else log(`      !! no guess for required payment field '${key}'`);
    }
    if (!changed) { log("    (no automatic fix — stopping payment discovery)"); break; }
  }

  if (payment) {
    await statusOf("after-payment-created");
    log("  -- #8: CONFIRMED update path = PUT /4.0/purchase/outgoing-payments with payment_id in BODY:");
    const upd = await req("PUT", "/4.0/purchase/outgoing-payments", { payment_id: payment.id, execution_date: TODAY, amount: 99 });
    log(`    -> ${upd.status} ${short(upd.data, 300)}`);
    log("  -- confirm the OLD (broken) path /{id} 405s:");
    await req("PUT", `/4.0/purchase/outgoing-payments/${payment.id}`, { amount: 99 });
    await req("PATCH", `/4.0/purchase/outgoing-payments/${payment.id}`, { amount: 99 });
  }

  log("\n=== PROBE COMPLETE (cleanup below) ===");
}

main()
  .catch((e) => log("FATAL " + (e?.stack ?? e)))
  .finally(async () => { await cleanup(); process.exit(0); });
