#!/usr/bin/env node
// Focused cleanup for a stuck PAID test bill + its payment. Run from src/.
import fs from "node:fs";
import axios from "axios";
const token = (fs.readFileSync(".env", "utf8").match(/BEXIO_API_TOKEN=(.+)/) || [])[1]?.trim();
const api = axios.create({ baseURL: "https://api.bexio.com", headers: { Authorization: `Bearer ${token}`, Accept: "application/json", "Content-Type": "application/json" }, validateStatus: () => true });
const log = (...a) => console.log(...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const BILL = process.argv[2] || "80252086-b2d7-43de-9992-705c47feb059";
const PAYMENT = process.argv[3] || "247964b3-4693-4373-b067-0a05fa388ae9";

async function delPayment(id) {
  for (let t = 0; t < 8; t++) {
    const r = await api.delete(`/4.0/purchase/outgoing-payments/${id}`);
    log(`  del payment ${id} try ${t}: ${r.status}`);
    if ([200, 204, 404].includes(r.status)) return true;
    await sleep(1200);
  }
  return false;
}

await delPayment(PAYMENT);
const pays = (await api.get(`/4.0/purchase/outgoing-payments?bill_id=${BILL}`)).data;
log("payments still on bill: " + JSON.stringify(pays).slice(0, 300));
for (const p of (Array.isArray(pays) ? pays : [])) await delPayment(p.id);

let g = await api.get(`/4.0/purchase/bills/${BILL}`);
log(`bill status now: ${g.data?.status}`);
const rev = await api.put(`/4.0/purchase/bills/${BILL}/bookings/DRAFT`);
log(`revert->DRAFT: ${rev.status} ${rev.status >= 400 ? JSON.stringify(rev.data) : ""}`);
const del = await api.delete(`/4.0/purchase/bills/${BILL}`);
log(`delete bill: ${del.status} ${del.status >= 400 ? JSON.stringify(del.data) : ""}`);
const check = await api.get(`/4.0/purchase/bills/${BILL}`);
log(`final bill GET: ${check.status} (404 = gone)`);
process.exit(0);
