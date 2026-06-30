#!/usr/bin/env node
/**
 * End-to-end live verification of the v2.4.1 fixes, exercised through the REAL
 * built handlers (dist/) against the live Bexio test account — i.e. the same code
 * path the MCP server runs, not raw axios. Proves the fixes across layers.
 *
 * Creates a throwaway bill + payment and deletes them in a finally block.
 * Reads the token from .env, never prints it. Run from src/ after `npm run build`
 * (or at least tsc): node scripts/verify-fixes.mjs
 */
import fs from "node:fs";
import axios from "axios";
import { BexioClient } from "../dist/bexio-client.js";
import { handlers as purchase } from "../dist/tools/purchase/index.js";

const token = (fs.readFileSync(".env", "utf8").match(/BEXIO_API_TOKEN=(.+)/) || [])[1]?.trim();
if (!token) { console.error("No token"); process.exit(1); }
const client = new BexioClient({ baseUrl: "https://api.bexio.com/2.0", apiToken: token });
const raw = axios.create({
  baseURL: "https://api.bexio.com",
  headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json" },
  validateStatus: () => true,
});

const TAG = "ZZZ-VERIFY-DELETE-ME";
const TODAY = "2026-06-30", DUE = "2026-07-30";
const log = (...a) => console.log(...a);
let billId = null, paymentId = null, pass = 0, fail = 0;
const check = (name, cond, extra = "") => {
  if (cond) { pass++; log(`  PASS  ${name}  ${extra}`); }
  else { fail++; log(`  FAIL  ${name}  ${extra}`); }
};

try {
  const contacts = await client.listContacts({ limit: 50 });
  const supplier = contacts[0];
  const person = contacts.find((c) => c.contact_type_id === 2) ?? supplier;
  const taxes = await client.listTaxes({ limit: 200 });
  const tax = taxes.find((t) => t.is_active && /pre_tax/.test(String(t.type))) ?? taxes.find((t) => t.is_active);
  const accounts = await client.listAccounts({ limit: 2000 });
  const acct = accounts.find((a) => a.is_active && !a.is_locked && Number(a.account_no) >= 4000 && Number(a.account_no) < 7000) ?? accounts.find((a) => a.is_active);
  const banks = await client.listBankAccounts({});
  const bank = (Array.isArray(banks) ? banks : [])[0];
  log(`refs: supplier=${supplier?.id} person=${person?.id} tax=${tax?.id} acct=${acct?.id} bank=${bank?.id}`);

  // #9 create_bill (correct field names) through the handler
  const bill = await purchase.create_bill(client, {
    bill_data: {
      currency_code: "CHF",
      address: { lastname_company: supplier.name_1, type: "COMPANY", address_line: "Teststrasse 1", postcode: "6300", city: "Zug", country_code: "CH" },
      item_net: true, supplier_id: supplier.id, due_date: DUE, contact_partner_id: person.id,
      bill_date: TODAY, manual_amount: false, amount_calc: 100, title: `${TAG} bill`,
      line_items: [{ amount: 100, position: 0, title: `${TAG} line`, tax_id: tax.id, booking_account_id: acct.id }],
    },
  });
  billId = bill.id;
  const docNo = bill.document_no;
  check("#9 create_bill via handler", !!billId && bill.status === "DRAFT", `id=${billId} doc=${docNo}`);

  // #7 update_bill: change only title, document_no must survive
  await purchase.update_bill(client, { bill_id: billId, bill_data: { title: `${TAG} retitled` } });
  const afterUpd = await client.getBill(billId);
  check("#7 update_bill preserves document_no", afterUpd.document_no === docNo, `doc=${afterUpd.document_no}`);
  check("#7 update_bill applied the change", afterUpd.title === `${TAG} retitled`, `title=${afterUpd.title}`);

  // #6 issue_bill -> BOOKED
  await purchase.issue_bill(client, { bill_id: billId });
  const afterBook = await client.getBill(billId);
  check("#6 issue_bill books DRAFT->BOOKED", afterBook.status === "BOOKED", `status=${afterBook.status}`);

  // #6 mark_bill_as_paid -> guidance error (no broken request)
  let threw = false, msg = "";
  try { await purchase.mark_bill_as_paid(client, { bill_id: billId }); }
  catch (e) { threw = true; msg = e?.message ?? String(e); }
  check("#6 mark_bill_as_paid returns guidance", threw && /create_outgoing_payment/.test(msg), threw ? "(points to create_outgoing_payment)" : "did NOT throw");

  // #9 create_outgoing_payment -> bill becomes PAID
  const pay = await purchase.create_outgoing_payment(client, {
    payment_data: { bill_id: billId, payment_type: "MANUAL", execution_date: TODAY, amount: 100, currency_code: "CHF", exchange_rate: 1, is_salary_payment: false, sender_bank_account_id: bank.id },
  });
  paymentId = pay?.id ?? pay?.data?.id;
  const afterPay = await client.getBill(billId);
  check("#9 create_outgoing_payment + bill PAID", !!paymentId && afterPay.status === "PAID", `payId=${paymentId} status=${afterPay.status}`);

  // #8 update_outgoing_payment -> the old code hit the wrong URL and got 405.
  // The fix PUTs the collection path with payment_id in the body, so the request
  // now reaches Bexio's business logic. (Bexio only allows updating IBAN/QR
  // payments, not MANUAL — that is a Bexio rule, not the bug. A non-405 response
  // proves the endpoint correction.) We also send create-only fields
  // (currency_code/exchange_rate) to prove the client strips them.
  let updMsg = "";
  try {
    await purchase.update_outgoing_payment(client, { payment_id: paymentId, payment_data: { execution_date: TODAY, amount: 100, is_salary_payment: false, fee_type: "NO_FEE", currency_code: "CHF", exchange_rate: 1 } });
    updMsg = "OK (updated)";
  } catch (e) { updMsg = e?.message ?? String(e); }
  const no405 = !/\b405\b|method\s+not\s+allow/i.test(updMsg) && !/Unrecognized property/i.test(updMsg);
  check("#8 update_outgoing_payment endpoint fixed (no 405, fields accepted)", no405, `-> ${updMsg}`);
} catch (e) {
  log("FATAL " + (e?.stack ?? e)); fail++;
} finally {
  log("\n-- cleanup --");
  const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
  const ok = (s) => [200, 204].includes(s);
  if (paymentId) {
    let s = 0;
    for (let t = 0; t < 6; t++) { s = (await raw.delete(`/4.0/purchase/outgoing-payments/${paymentId}`)).status; if (ok(s) || s === 404) break; await sleep(1000); }
    log(`payment ${paymentId}: ${ok(s) || s === 404 ? "deleted" : "DELETE " + s}`);
  }
  if (billId) {
    let s = (await raw.delete(`/4.0/purchase/bills/${billId}`)).status;
    // Booked/paid bills need reverting to DRAFT first; the revert can hit a
    // transient "Banking request failed" right after payment deletion — retry.
    for (let t = 0; t < 6 && !ok(s); t++) {
      await sleep(1500);
      await raw.put(`/4.0/purchase/bills/${billId}/bookings/DRAFT`);
      s = (await raw.delete(`/4.0/purchase/bills/${billId}`)).status;
    }
    log(`bill ${billId}: ${ok(s) ? "deleted" : "DELETE FAILED " + s + " <-- MANUAL CLEANUP"}`);
  }
  log(`\n=== RESULT: ${pass} passed, ${fail} failed ===`);
  process.exit(fail === 0 ? 0 : 1);
}
