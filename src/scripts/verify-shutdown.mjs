#!/usr/bin/env node
/**
 * Process-level verification that a stdio-mode server never outlives its client.
 * Run from src/ after build: node scripts/verify-shutdown.mjs
 *
 * #11  Clean disconnect: the client closes our stdin -> the server must exit.
 * #18  Half-dead client: stdout and stderr readers are gone but stdin stays open.
 *      The next write fails with EPIPE; before the fix, the uncaughtException
 *      handler logged it to the same dead stderr -> EPIPE -> log -> ... forever,
 *      pinning a CPU core. The server must exit instead.
 * #18  Only stderr gone: the server must keep answering over stdout, not spin.
 *
 * No API call is needed, so a dummy token is used (never a real one).
 */
import { spawn, execFileSync } from "node:child_process";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function start() {
  const child = spawn(process.execPath, ["dist/index.js"], {
    env: { ...process.env, BEXIO_API_TOKEN: "dummy-token-for-shutdown-test", BEXIO_API_TOKENS: "" },
    stdio: ["pipe", "pipe", "pipe"],
  });
  const state = { child, exited: false, code: null, sig: null, stdout: "" };
  child.on("exit", (c, s) => Object.assign(state, { exited: true, code: c, sig: s }));
  child.stdout.on("data", (d) => (state.stdout += d));
  child.stderr.on("data", () => {});
  return state;
}

async function waitExit(state, ms) {
  const t0 = Date.now();
  while (!state.exited && Date.now() - t0 < ms) await sleep(100);
  return Date.now() - t0;
}

function cpu(pid) {
  try {
    return execFileSync("ps", ["-o", "%cpu=", "-p", String(pid)], { encoding: "utf8" }).trim();
  } catch {
    return "?";
  }
}

const send = (state, msg) => state.child.stdin.write(JSON.stringify(msg) + "\n");
let failed = false;

// --- #11: clean disconnect ---------------------------------------------------
{
  const s = start();
  await sleep(1800); // let it register tools + connect transport
  if (s.exited) {
    console.log(`FAIL  #11 server exited before we closed stdin (code=${s.code})`);
    failed = true;
  } else {
    s.child.stdin.end();
    const dt = await waitExit(s, 4000);
    if (s.exited) console.log(`PASS  #11 server exited ${dt}ms after stdin close (code=${s.code} sig=${s.sig})`);
    else {
      console.log("FAIL  #11 server did NOT exit within 4s of stdin close - killing");
      s.child.kill("SIGKILL");
      failed = true;
    }
  }
}

// --- #18: half-dead client (stdout+stderr gone, stdin open) -------------------
{
  const s = start();
  await sleep(1800);
  send(s, {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "verify-shutdown", version: "1.0" } },
  });
  const t0 = Date.now();
  while (!s.stdout.includes('"id":1') && Date.now() - t0 < 4000) await sleep(50);
  send(s, { jsonrpc: "2.0", method: "notifications/initialized" });
  await sleep(300);

  // The client half-dies: close our read ends of its stdout and stderr.
  s.child.stdout.destroy();
  s.child.stderr.destroy();
  await sleep(200);
  send(s, { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "ping", arguments: {} } });

  const dt = await waitExit(s, 3000);
  if (s.exited) {
    console.log(`PASS  #18 server exited ${dt}ms after its stdout/stderr readers died (code=${s.code} sig=${s.sig})`);
  } else {
    console.log(`FAIL  #18 server still alive 3s after stdout/stderr died - CPU ${cpu(s.child.pid)}% - killing`);
    s.child.kill("SIGKILL");
    failed = true;
  }
}

// --- #18 guard: only stderr gone -> keep serving over stdout, no spin ----------
{
  const s = start();
  await sleep(1800);
  send(s, {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "verify-shutdown", version: "1.0" } },
  });
  let t0 = Date.now();
  while (!s.stdout.includes('"id":1') && Date.now() - t0 < 4000) await sleep(50);
  send(s, { jsonrpc: "2.0", method: "notifications/initialized" });
  await sleep(300);

  s.child.stderr.destroy(); // client drops stderr only
  await sleep(200);
  send(s, { jsonrpc: "2.0", id: 2, method: "tools/call", params: { name: "ping", arguments: {} } });
  t0 = Date.now();
  while (!s.stdout.includes('"id":2') && Date.now() - t0 < 4000) await sleep(50);
  await sleep(1000);
  const load = parseFloat(cpu(s.child.pid));

  if (s.exited) {
    console.log(`FAIL  #18 server exited although only stderr was gone (code=${s.code})`);
    failed = true;
  } else if (!s.stdout.includes('"id":2')) {
    console.log("FAIL  #18 no ping response over stdout after stderr was dropped");
    failed = true;
  } else if (!(load < 50)) {
    console.log(`FAIL  #18 server spinning at ${load}% CPU after stderr was dropped`);
    failed = true;
  } else {
    console.log(`PASS  #18 stderr-only loss: still serving over stdout, CPU ${load}%`);
  }
  s.child.stdin.end();
  await waitExit(s, 3000);
  if (!s.exited) s.child.kill("SIGKILL");
}

process.exit(failed ? 1 : 0);
