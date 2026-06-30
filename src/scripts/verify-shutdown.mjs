#!/usr/bin/env node
/**
 * Live verification of #11: a stdio-mode server must EXIT when its parent closes
 * stdin (instead of lingering as an orphan). Spawns dist/index.js, lets it start,
 * closes its stdin, and asserts it exits within a few seconds.
 * Run from src/ after build: node scripts/verify-shutdown.mjs
 */
import { spawn } from "node:child_process";
import fs from "node:fs";

const token = (fs.readFileSync(".env", "utf8").match(/BEXIO_API_TOKEN=(.+)/) || [])[1]?.trim();
if (!token) { console.error("No token"); process.exit(1); }

const child = spawn(process.execPath, ["dist/index.js"], {
  env: { ...process.env, BEXIO_API_TOKEN: token },
  stdio: ["pipe", "pipe", "pipe"],
});
let exited = false, code = null, sig = null;
child.on("exit", (c, s) => { exited = true; code = c; sig = s; });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
await sleep(1800); // let it register tools + connect transport

if (exited) { console.log(`FAIL #11 server exited before we closed stdin (code=${code})`); process.exit(1); }

const t0 = Date.now();
child.stdin.end(); // closing stdin should trigger the shutdown handler
while (!exited && Date.now() - t0 < 4000) await sleep(100);

if (exited) {
  console.log(`PASS  #11 server exited ${Date.now() - t0}ms after stdin close (code=${code} sig=${sig})`);
  process.exit(0);
} else {
  console.log("FAIL  #11 server did NOT exit within 4s of stdin close — killing");
  child.kill("SIGKILL");
  process.exit(1);
}
