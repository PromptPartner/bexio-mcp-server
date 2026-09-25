#!/usr/bin/env node
/**
 * Render a built MCP App panel in headless Chrome the way an MCP host does (the panel
 * HTML as one document in an iframe), complete the MCP Apps handshake, send the
 * panel's data with an XSS payload in its text fields, and report what rendered.
 *
 *   node scripts/verify-ui-render.mjs [dist/ui/ui/<panel>/<panel>.html]   (default: all)
 *
 * Expect: initialized/rendered true, the payload visible as text, injectedImgs 0,
 * pwned false. A panel that imports a missing chunk never initializes ("Loading...").
 * Needs Google Chrome (CHROME env var to override the path). Run after a build.
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const chrome = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const XSS = (n) => `<img src=x onerror="parent.postMessage({pwned:${n}},'*')">`;
const PAYLOADS = {
  "contact-card": {
    id: 1, nr: "1", contact_type_id: 1, name_1: `${XSS(1)}Evil AG`, name_2: null,
    mail: `a@b.ch">${XSS(2)}`, phone_fixed: null, phone_mobile: null, fax: null, url: null,
    address: `Teststrasse 1${XSS(3)}`, postcode: "6300", city: "Zug", country_id: 1,
  },
  dashboard: {
    open_invoices_count: 2, open_invoices_total: 150, overdue_count: 1, overdue_total: 50, currency: `CHF${XSS(4)}`,
    recent_contacts: [{ id: 1, name_1: `${XSS(5)}Evil AG`, name_2: null }],
  },
  "invoice-preview": {
    id: 1, document_nr: `RE-1${XSS(6)}`, title: `${XSS(7)}Title`, contact_id: 1, currency_id: 1,
    contact_address: `Evil AG${XSS(8)}\nZug`, is_valid_from: "2026-09-25", is_valid_to: "2026-10-25",
    kb_item_status_id: 7, total_gross: "10.00",
    positions: [{ text: `${XSS(9)}Pos`, amount: 1, unit_price: 10 }],
  },
};

const targets = process.argv[2]
  ? [process.argv[2]]
  : Object.keys(PAYLOADS).map((n) => `dist/ui/ui/${n}/${n}.html`);
let failed = false;
for (const panelPath of targets) {
  const name = path.basename(panelPath, ".html");
  const ok = await renderOne(panelPath, PAYLOADS[name]);
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}: panel ${ok ? "renders and escapes" : "did not render safely"}`);
  if (!ok) failed = true;
}
process.exit(failed ? 1 : 0);

async function renderOne(panelPath, data) {
const work = fs.mkdtempSync(path.join(os.tmpdir(), "ui-render-"));
const panel = fs.readFileSync(panelPath, "utf-8");
const host = `<!doctype html><html><body><pre id="out">pending</pre><script>
const out = { pwned: false, initialized: false, rendered: false };
const f = document.createElement("iframe");
window.addEventListener("message", (e) => {
  const m = e.data;
  if (m && m.pwned) out.pwned = true;
  if (!m || m.jsonrpc !== "2.0") return;
  if (m.method === "ui/initialize") f.contentWindow.postMessage({ jsonrpc: "2.0", id: m.id, result: {
    protocolVersion: (m.params && m.params.protocolVersion) || "2025-11-21",
    hostInfo: { name: "verify-ui-render", version: "1" }, hostCapabilities: {}, hostContext: {} } }, "*");
  if (m.method === "ui/notifications/initialized") {
    out.initialized = true;
    f.contentWindow.postMessage({ jsonrpc: "2.0", method: "ui/notifications/tool-result",
      params: { content: [{ type: "text", text: ${JSON.stringify(JSON.stringify(data))} }] } }, "*");
  }
});
f.srcdoc = ${JSON.stringify(panel).replace(/<\/script/gi, "<\\/script")};
document.body.appendChild(f);
setTimeout(() => {
  const d = f.contentDocument, app = d.getElementById("app"), text = app.textContent.trim();
  Object.assign(out, { rendered: out.initialized && !/^(Loading|Error)/.test(text),
    injectedImgs: d.querySelectorAll("img").length, payloadShownAsText: text.includes("onerror="),
    appText: text.replace(/\\s+/g, " ").slice(0, 80) });
  document.getElementById("out").textContent = JSON.stringify(out);
}, 3000);
</script></body></html>`;
const hostFile = path.join(work, "host.html");
fs.writeFileSync(hostFile, host);

const port = 9000 + Math.floor(Math.random() * 500);
const proc = spawn(chrome, ["--headless=new", "--disable-gpu", "--no-first-run", "--no-default-browser-check",
  `--user-data-dir=${path.join(work, "profile")}`, `--remote-debugging-port=${port}`, "about:blank"], { stdio: "ignore" });
const cleanup = async () => {
  const exited = new Promise((r) => proc.once("exit", r));
  try { proc.kill("SIGKILL"); } catch {}
  await Promise.race([exited, sleep(3000)]); // Chrome may still be writing its profile
  try { fs.rmSync(work, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 }); } catch {}
};

let target;
for (let i = 0; i < 50 && !target; i++) {
  try { target = await (await fetch(`http://127.0.0.1:${port}/json/new?file://${hostFile}`, { method: "PUT" })).json(); }
  catch { await sleep(200); }
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener("open", r, { once: true }));
const result = new Promise((resolve) => ws.addEventListener("message", (e) => {
  const m = JSON.parse(e.data);
  if (m.id === 1) resolve(JSON.parse(m.result.result.value));
}));
await sleep(5000);
ws.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: "document.getElementById('out').textContent", returnByValue: true } }));
const out = await Promise.race([result, sleep(10000).then(() => ({ timeout: true }))]);
ws.close();
await cleanup();
console.log("      " + JSON.stringify(out));
return out.initialized && out.rendered && !out.pwned && out.injectedImgs === 0 && out.payloadShownAsText;
}
