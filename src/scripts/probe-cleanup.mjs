#!/usr/bin/env node
/**
 * One-off cleanup for the Phase-0 probe: removes every leftover bill/payment
 * tagged ZZZ-PROBE-DELETE-ME from the live account. A PAID bill must have its
 * payment(s) deleted, then be reverted BOOKED->DRAFT, before it can be deleted.
 * Run from src/:  node scripts/probe-cleanup.mjs
 */
import fs from "node:fs";
import axios from "axios";

const token = (fs.readFileSync(".env", "utf8").match(/BEXIO_API_TOKEN=(.+)/) || [])[1]?.trim();
if (!token) { console.error("No token"); process.exit(1); }
const api = axios.create({
  baseURL: "https://api.bexio.com",
  headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json" },
  validateStatus: () => true, timeout: 30000,
});
const log = (...a) => console.log(...a);
const TAG = "ZZZ-PROBE-DELETE-ME";

// Known leftover id(s) from probe runs that could not auto-clean, plus anything
// the list still returns. Direct GET is authoritative; the list can filter.
const KNOWN_IDS = ["80252086-b2d7-43de-9992-705c47feb059"];
const bills = (await api.get("/4.0/purchase/bills?limit=200")).data;
const fromList = (Array.isArray(bills) ? bills : []).filter((b) => String(b.title ?? "").includes(TAG));
const targets = [...fromList];
for (const kid of KNOWN_IDS) {
  if (targets.some((b) => b.id === kid)) continue;
  const g = await api.get(`/4.0/purchase/bills/${kid}`);
  if (g.status < 400 && g.data?.id) { log(`  known id ${kid} still exists (status=${g.data.status}) — adding`); targets.push(g.data); }
  else log(`  known id ${kid}: GET ${g.status} (already gone)`);
}
log(`Found ${targets.length} ${TAG} bill(s): ${targets.map((b) => `${b.id}(${b.status})`).join(", ") || "none"}`);

for (const b of targets) {
  const id = b.id;
  // delete any outgoing payments on this bill
  const pays = (await api.get(`/4.0/purchase/outgoing-payments?bill_id=${id}`)).data;
  for (const p of (Array.isArray(pays) ? pays : [])) {
    let r;
    for (let t = 0; t < 4; t++) {
      r = await api.delete(`/4.0/purchase/outgoing-payments/${p.id}`);
      if ([200, 204].includes(r.status)) break;
      await new Promise((res) => setTimeout(res, 700)); // retry transient 500s
    }
    log(`  payment ${p.id}: ${[200, 204].includes(r.status) ? "DELETED" : "FAILED " + r.status}`);
  }
  // revert to DRAFT (status may now be BOOKED after payment removal)
  let r = await api.delete(`/4.0/purchase/bills/${id}`);
  if (![200, 204].includes(r.status)) {
    const rev = await api.put(`/4.0/purchase/bills/${id}/bookings/DRAFT`);
    log(`  bill ${id}: revert->DRAFT ${rev.status} ${rev.status >= 400 ? JSON.stringify(rev.data) : ""}`);
    r = await api.delete(`/4.0/purchase/bills/${id}`);
  }
  log(`  bill ${id}: ${[200, 204].includes(r.status) ? "DELETED" : "FAILED " + r.status + " " + JSON.stringify(r.data)}`);
}

// Re-verify nothing remains
const after = (await api.get("/4.0/purchase/bills?limit=200")).data;
const left = (Array.isArray(after) ? after : []).filter((b) => String(b.title ?? "").includes(TAG));
log(`\nRemaining ${TAG} bills: ${left.length} ${left.map((b) => b.id + "(" + b.status + ")").join(", ")}`);
process.exit(0);
