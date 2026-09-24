#!/usr/bin/env node
/**
 * Live verification of the v2.6.0 fixes against a real bexio company, through the
 * REAL built handlers (dist/), i.e. the code path the MCP server runs.
 *
 * Only touches records it creates itself (tagged ZZZ-VERIFY-DELETE-ME); every one is
 * deleted in a finally block, and anything that could not be deleted is listed.
 * Journal / balance checks are read-only. The manual group entry is posted and then
 * deleted again.
 *
 * Token from the environment only (never printed, no fallback):
 *   BEXIO_API_TOKEN="$(security find-generic-password -s bexio-mcp-test -w)" \
 *     node scripts/verify-v2.6.0.mjs
 * Run from src/ after a build.
 */
import os from "node:os";
import path from "node:path";
import { writeFile, rm, mkdtemp } from "node:fs/promises";
import { BexioClient } from "../dist/bexio-client.js";
import { setTransportMode } from "../dist/shared/path-guard.js";
import { handlers as invoices } from "../dist/tools/invoices/index.js";
import { handlers as quotes } from "../dist/tools/quotes/index.js";
import { handlers as orders } from "../dist/tools/orders/index.js";
import { handlers as items } from "../dist/tools/items/index.js";
import { handlers as notes } from "../dist/tools/notes/index.js";
import { handlers as contacts } from "../dist/tools/contacts/index.js";
import { handlers as files } from "../dist/tools/files/index.js";
import { handlers as reference } from "../dist/tools/reference/index.js";
import { handlers as accounting } from "../dist/tools/accounting/index.js";

const token = process.env.BEXIO_API_TOKEN?.trim();
if (!token) {
  console.error("BEXIO_API_TOKEN is not set (see the header of this script).");
  process.exit(1);
}
const client = new BexioClient({ baseUrl: "https://api.bexio.com/2.0", apiToken: token });
setTransportMode("stdio");

const TAG = "ZZZ-VERIFY-DELETE-ME";
const today = new Date().toISOString().slice(0, 10);
const year = today.slice(0, 4);
let pass = 0;
let fail = 0;
const cleanup = []; // [label, fn], run in reverse order
const check = (name, cond, extra = "") => {
  cond ? pass++ : fail++;
  console.log(`  ${cond ? "PASS" : "FAIL"}  ${name}${extra ? `  (${extra})` : ""}`);
};
const info = (name, extra) => console.log(`  INFO  ${name}  (${extra})`);
async function attempt(name, fn) {
  try {
    await fn();
  } catch (err) {
    fail++;
    console.log(`  FAIL  ${name}  threw: ${err?.message ?? err}`);
  }
}

try {
  const me = await client.getCurrentUser();
  const userId = me.id;
  const profile = await client.getCompanyProfile();
  console.log(`company: ${(Array.isArray(profile) ? profile[0] : profile)?.name}  user: ${userId}\n`);

  // ---------- throwaway contact (also the parent for documents) ----------
  let contactId;
  await attempt("#17 create_contact with deprecated address", async () => {
    const c = await contacts.create_contact(client, {
      contact_type: "company",
      name_1: `${TAG} contact`,
      address: "Teststrasse 12a",
      postcode: "6300",
      city: "Zug",
      user_id: userId,
    });
    contactId = c.id;
    cleanup.push(["contact", () => contacts.delete_contact(client, { contact_id: contactId })]);
    const got = await client.getContact(contactId);
    check("#17 address split into street_name + house_number", got.street_name === "Teststrasse" && got.house_number === "12a",
      `street_name=${got.street_name} house_number=${got.house_number} address=${JSON.stringify(got.address)}`);
    await contacts.update_contact(client, { contact_id: contactId, contact_data: { address: "Neuweg 5" } });
    const upd = await client.getContact(contactId);
    check("#17 update_contact maps address", upd.street_name === "Neuweg" && upd.house_number === "5" && upd.city === "Zug",
      `street_name=${upd.street_name} house_number=${upd.house_number} city=${upd.city}`);
  });
  if (!contactId) throw new Error("no throwaway contact - stopping before document tests");

  // ---------- additional address ----------
  await attempt("additional address street fields", async () => {
    const a = await files.create_additional_address(client, {
      contact_id: contactId,
      address_data: { name: `${TAG} addr`, street_name: "Lagerweg", house_number: "7", postcode: "6300", city: "Zug" },
    });
    cleanup.push(["additional address", () => files.delete_additional_address(client, { contact_id: contactId, address_id: a.id })]);
    const got = await client.getAdditionalAddress(contactId, a.id);
    check("create_additional_address keeps street_name/house_number", got.street_name === "Lagerweg" && got.house_number === "7",
      `street_name=${got.street_name} house_number=${got.house_number}`);
    await files.update_additional_address(client, { contact_id: contactId, address_id: a.id, address_data: { address: "Seeweg 3" } });
    const upd = await client.getAdditionalAddress(contactId, a.id);
    check("update_additional_address (POST) maps address, keeps city", upd.street_name === "Seeweg" && upd.city === "Zug",
      `street_name=${upd.street_name} city=${upd.city}`);
  });

  // ---------- #19 edit_item: partial edit must not wipe fields ----------
  await attempt("#19 edit_item", async () => {
    const it = await items.create_item(client, {
      item_data: { intern_name: `${TAG} item`, article_type_id: 1, sale_price: 12.5, purchase_price: 7.25, description: "keep me" },
    });
    cleanup.push(["item", () => items.delete_item(client, { item_id: it.id })]);
    const before = await client.getItem(it.id);
    await items.edit_item(client, { item_id: it.id, item_data: { intern_name: `${TAG} item renamed` } });
    const after = await client.getItem(it.id);
    check("#19 edit_item changes the field", after.intern_name === `${TAG} item renamed`);
    check("#19 edit_item keeps the others (no overwrite)",
      Number(after.sale_price) === Number(before.sale_price) && Number(after.purchase_price) === Number(before.purchase_price) &&
        after.intern_code === before.intern_code && after.description === before.description,
      `sale ${before.sale_price}->${after.sale_price}, purchase ${before.purchase_price}->${after.purchase_price}, code ${before.intern_code}->${after.intern_code}`);
  });

  // ---------- #19 edit_invoice + error details + POST-partial experiment ----------
  await attempt("#19 edit_invoice", async () => {
    const inv = await invoices.create_invoice(client, {
      invoice_data: { contact_id: contactId, user_id: userId, title: `${TAG} invoice`, mwst_type: 0, mwst_is_net: true },
    });
    cleanup.push(["invoice", () => invoices.delete_invoice(client, { invoice_id: inv.id })]);
    await invoices.edit_invoice(client, { invoice_id: inv.id, invoice_data: { reference: "V260-REF" } });
    const got = await client.getInvoice(inv.id);
    check("#19 edit_invoice succeeds and applies", got.reference === "V260-REF" && got.title === `${TAG} invoice`,
      `reference=${got.reference} title=${got.title}`);

    try {
      await client.editInvoice(inv.id, { esr_id: 1, qr_invoice_id: 1 });
      info("error details: bexio accepted esr_id/qr_invoice_id", "no error to inspect");
    } catch (err) {
      check("#19 bexio error details surfaced (errors[])", /esr_id|qr_invoice_id|Widget/.test(err.message), err.message.slice(0, 160));
    }

    // Experiment: is POST a true partial edit (no merge list needed)?
    await client.editInvoice(inv.id, { title: `${TAG} invoice partial` });
    const p = await client.getInvoice(inv.id);
    info("EXPERIMENT raw POST {title} only",
      `title=${p.title === `${TAG} invoice partial`} reference kept=${p.reference === "V260-REF"} contact kept=${p.contact_id === contactId}`);
  });

  // ---------- #19 edit_quote ----------
  await attempt("#19 edit_quote", async () => {
    const q = await quotes.create_quote(client, { contact_id: contactId, quote_data: { user_id: userId, title: `${TAG} quote`, mwst_type: 0, mwst_is_net: true } });
    cleanup.push(["quote", () => quotes.delete_quote(client, { quote_id: q.id })]);
    await quotes.edit_quote(client, { quote_id: q.id, quote_data: { title: `${TAG} quote edited` } });
    const got = await client.getQuote(q.id);
    check("#19 edit_quote", got.title === `${TAG} quote edited` && got.contact_id === contactId, `title=${got.title}`);
  });

  // ---------- #19 edit_order + repetition path ----------
  await attempt("#19 edit_order / repetition", async () => {
    const o = await orders.create_order(client, { order_data: { contact_id: contactId, user_id: userId, title: `${TAG} order`, mwst_type: 0, mwst_is_net: true } });
    cleanup.push(["order", () => orders.delete_order(client, { order_id: o.id })]);
    await orders.edit_order(client, { order_id: o.id, order_data: { title: `${TAG} order edited` } });
    const got = await client.getOrder(o.id);
    check("#19 edit_order", got.title === `${TAG} order edited` && got.contact_id === contactId, `title=${got.title}`);

    const nextMonth = new Date(Date.now() + 31 * 864e5).toISOString().slice(0, 10);
    await orders.edit_order_repetition(client, {
      order_id: o.id,
      repetition_data: { start: nextMonth, end: null, repetition: { type: "monthly", interval: 1, schedule: "fixed_day" } },
    });
    const rep = await orders.get_order_repetition(client, { order_id: o.id });
    check("repetition: edit_order_repetition at /kb_order/{id}/repetition", !!rep && String(rep.start ?? "").startsWith(nextMonth),
      JSON.stringify(rep).slice(0, 120));
    await orders.delete_order_repetition(client, { order_id: o.id });
    let gone = false;
    try {
      const after = await orders.get_order_repetition(client, { order_id: o.id });
      gone = !after || (typeof after === "object" && Object.keys(after).length === 0);
    } catch (err) {
      gone = err.statusCode === 404;
    }
    check("repetition: delete_order_repetition", gone);
  });

  // ---------- #19 update_note ----------
  await attempt("#19 update_note", async () => {
    const n = await notes.create_note(client, {
      user_id: userId, event_start: `${today} 09:00:00`, subject: `${TAG} note`, content: "keep me", contact_id: contactId,
    });
    cleanup.push(["note", () => notes.delete_note(client, { note_id: n.id })]);
    await notes.update_note(client, { note_id: n.id, note_data: { subject: `${TAG} note edited` } });
    const got = await client.getNote(n.id);
    check("#19 update_note keeps the other fields", got.subject === `${TAG} note edited` && (got.info === "keep me" || got.content === "keep me"),
      `subject=${got.subject} info=${JSON.stringify(got.info ?? got.content)}`);
  });

  // ---------- #19 contact group / salutation / title ----------
  for (const [kind, create, update, del, getName] of [
    ["contact_group", (n) => reference.create_contact_group(client, { name: n }), (id, n) => reference.update_contact_group(client, { group_id: id, name: n }), (id) => reference.delete_contact_group(client, { group_id: id }), (id) => client.getContactGroup(id)],
    ["salutation", (n) => reference.create_salutation(client, { name: n }), (id, n) => reference.update_salutation(client, { salutation_id: id, name: n }), (id) => reference.delete_salutation(client, { salutation_id: id }), (id) => client.getSalutation(id)],
    ["title", (n) => reference.create_title(client, { name: n }), (id, n) => reference.update_title(client, { title_id: id, name: n }), (id) => reference.delete_title(client, { title_id: id }), (id) => client.getTitle(id)],
  ]) {
    await attempt(`#19 update_${kind}`, async () => {
      const r = await create(`${TAG} ${kind}`);
      cleanup.push([kind, () => del(r.id)]);
      await update(r.id, `${TAG} ${kind} edited`);
      const got = await getName(r.id);
      check(`#19 update_${kind} (POST)`, got.name === `${TAG} ${kind} edited`, `name=${got.name}`);
    });
  }

  // ---------- #20 / #16 upload_file ----------
  const tmp = await mkdtemp(path.join(os.tmpdir(), "bexio-verify-"));
  cleanup.push(["temp dir", () => rm(tmp, { recursive: true, force: true })]);
  await attempt("#20 upload_file (base64)", async () => {
    const f = await files.upload_file(client, {
      name: `${TAG}.txt`, content_base64: Buffer.from("verify v2.6.0").toString("base64"), content_type: "text/plain",
    });
    const rec = Array.isArray(f) ? f[0] : f;
    cleanup.push(["file (base64)", () => files.delete_file(client, { file_id: rec.id })]);
    check("#20 upload_file base64 -> 201", !!rec?.id, `id=${rec?.id} uuid=${rec?.uuid}`);
  });
  await attempt("#16 upload_file (file_path)", async () => {
    const p = path.join(tmp, `${TAG}.pdf`);
    await writeFile(p, "%PDF-1.4\n% verify v2.6.0\n");
    const f = await files.upload_file(client, { file_path: p });
    const rec = Array.isArray(f) ? f[0] : f;
    cleanup.push(["file (path)", () => files.delete_file(client, { file_id: rec.id })]);
    check("#16 upload_file file_path -> 201", !!rec?.id, `id=${rec?.id} name=${rec?.name} mime=${rec?.mime_type}`);
  });

  // ---------- #22 journal / balances (read-only) ----------
  await attempt("#22 get_journal range", async () => {
    const j = await accounting.get_journal(client, { start_date: `${year}-01-01`, end_date: today, limit: 5 });
    check("#22 get_journal from/to honoured server-side", j.server_side_filter === true && j.truncated === false,
      `matched=${j.total_matched} scanned=${j.scanned_rows}`);
    const firstDate = j.entries?.[0]?.date?.slice(0, 10);
    check("#22 rows are inside the range", !firstDate || firstDate >= `${year}-01-01`, `first=${firstDate}`);
    const old = await accounting.get_journal(client, { end_date: `${Number(year) - 5}-12-31`, limit: 1 });
    check("#22 single-bound range works (no placeholder date sent)", old.start_date === null && old.server_side_filter !== false,
      `matched=${old.total_matched}`);
  });
  await attempt("#22 get_account_balances", async () => {
    const b = await accounting.get_account_balances(client, {});
    check("#22 get_account_balances not truncated", b.truncated === false && b.server_side_filter === true,
      `accounts=${b.account_count} scanned=${b.scanned_rows}`);
  });

  // ---------- #22 follow-up: base currency default + group entry ----------
  await attempt("#22 manual group entry with base-currency default", async () => {
    const baseId = await client.getBaseCurrencyId();
    const currencies = await client.listCurrencies();
    const base = (Array.isArray(currencies) ? currencies : []).find((c) => c.id === baseId);
    info("company base currency", `id=${baseId} name=${base?.name}`);
    const accts = await client.listAccounts({ limit: 2000 });
    const pick = (no) => accts.find((a) => String(a.account_no) === no && a.is_active && !a.is_locked);
    const debit = pick("1020") ?? pick("1000");
    const credit = pick("1000") && pick("1000") !== debit ? pick("1000") : pick("1010");
    if (!debit || !credit) {
      info("group entry skipped", "no unlocked 1000/1010/1020 accounts");
      return;
    }
    const e = await accounting.create_manual_group_entry(client, {
      date: today,
      reference_nr: TAG,
      entries: [
        { debit_account_id: debit.id, credit_account_id: credit.id, amount: 1, description: `${TAG} line 1` },
        { debit_account_id: credit.id, credit_account_id: debit.id, amount: 1, description: `${TAG} line 2` },
      ],
    });
    cleanup.push(["manual entry", () => accounting.delete_manual_entry(client, { entry_id: e.id })]);
    const lines = e.entries ?? [];
    check("#22 create_manual_group_entry posts one voucher", e.type === "manual_group_entry" && lines.length === 2, `id=${e.id}`);
    check("follow-up: lines default to the base currency", lines.every((l) => l.currency_id === baseId),
      `currency_ids=${lines.map((l) => l.currency_id).join(",")}`);
  });
} catch (err) {
  fail++;
  console.log(`  FAIL  aborted: ${err?.message ?? err}`);
} finally {
  console.log("\ncleanup:");
  const left = [];
  for (const [label, fn] of cleanup.reverse()) {
    try {
      await fn();
      console.log(`  deleted ${label}`);
    } catch (err) {
      left.push(label);
      console.log(`  LEFTOVER ${label}: ${err?.message ?? err}`);
    }
  }
  console.log(`\n=== ${pass} passed, ${fail} failed${left.length ? `, LEFTOVERS: ${left.join(", ")} (search bexio for ${TAG})` : ", nothing left behind"} ===`);
  process.exit(fail || left.length ? 1 : 0);
}
