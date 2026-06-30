#!/usr/bin/env node
/**
 * ESM replacement for the broken check-dupes.js (it's CJS in an ESM package).
 * Asserts no duplicate tool names in the built registry and that the v2.4.1
 * definition changes (#9, #10, #12, #6, #8) are present. Run from src/ after build.
 */
import { getAllToolDefinitions } from "../dist/tools/index.js";

const defs = getAllToolDefinitions();
const names = defs.map((d) => d.name);
const dupes = [...new Set(names.filter((n, i) => names.indexOf(n) !== i))];
console.log(`total tools: ${names.length}`);
console.log(`duplicate names: ${dupes.length ? dupes.join(", ") : "none"}`);

const find = (n) => defs.find((d) => d.name === n);
const desc = (n) => find(n)?.description || "";
const checks = [
  ["#12 create_iban_payment STANDALONE warning", /STANDALONE/.test(desc("create_iban_payment"))],
  ["#12 create_qr_payment STANDALONE warning", /STANDALONE/.test(desc("create_qr_payment"))],
  ["#10 download_file documents output_path", /output_path/.test(desc("download_file"))],
  ["#9 create_bill documents supplier_id/booking_account_id", /supplier_id/.test(desc("create_bill"))],
  ["#9 create_outgoing_payment documents payment_type", /payment_type/.test(desc("create_outgoing_payment"))],
  ["#6 issue_bill documents booking", /BOOKED|bookings/.test(desc("issue_bill"))],
  ["#6 mark_bill_as_paid points to create_outgoing_payment", /create_outgoing_payment/.test(desc("mark_bill_as_paid"))],
  ["#8 update_outgoing_payment notes currency_code not updatable", /NOT updatable/.test(desc("update_outgoing_payment"))],
];
let ok = dupes.length === 0;
for (const [n, c] of checks) { console.log(`  ${c ? "PASS" : "FAIL"}  ${n}`); if (!c) ok = false; }
console.log(`\n=== ${ok ? "ALL CHECKS PASS" : "CHECKS FAILED"} ===`);
process.exit(ok ? 0 : 1);
