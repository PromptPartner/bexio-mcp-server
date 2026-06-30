#!/usr/bin/env node
/**
 * Live verification of #10 (download_file size-guard) through the real built
 * handler. Exercises inline (high threshold), temp-file spill (threshold 0), and
 * explicit output_path. Run from src/ after build: node scripts/verify-download.mjs
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { BexioClient } from "../dist/bexio-client.js";
import { handlers as files } from "../dist/tools/files/index.js";

const token = (fs.readFileSync(".env", "utf8").match(/BEXIO_API_TOKEN=(.+)/) || [])[1]?.trim();
if (!token) { console.error("No token"); process.exit(1); }
const client = new BexioClient({ baseUrl: "https://api.bexio.com/2.0", apiToken: token });
const log = (...a) => console.log(...a);
let pass = 0, fail = 0;
const check = (n, c, e = "") => { if (c) { pass++; log(`  PASS  ${n}  ${e}`); } else { fail++; log(`  FAIL  ${n}  ${e}`); } };
const cleanup = [];

const list = await client.listFiles({ limit: 5 });
const arr = Array.isArray(list) ? list : (list?.data ?? []);
if (!arr.length) {
  log("No files on the account — #10 live test skipped (unit tests cover the logic).");
  process.exit(0);
}
const fid = arr[0].id;
log(`using file_id=${fid} name=${arr[0].name}`);

// inline path (very high threshold)
process.env.BEXIO_DOWNLOAD_INLINE_MAX_BYTES = "100000000";
const inline = await files.download_file(client, { file_id: fid });
check("#10 small file inlines (content_base64 present, no file_path)", !!inline.content_base64 && !inline.file_path, `size=${inline.size_bytes}`);

// temp-file spill (threshold 0 forces every file to disk)
process.env.BEXIO_DOWNLOAD_INLINE_MAX_BYTES = "0";
const spilled = await files.download_file(client, { file_id: fid });
if (spilled.file_path) cleanup.push(spilled.file_path);
const spilledOk = !!spilled.file_path && !spilled.content_base64 && fs.existsSync(spilled.file_path) && fs.statSync(spilled.file_path).size === spilled.size_bytes;
check("#10 over-threshold spills to file_path (no base64, bytes match)", spilledOk, `path=${spilled.file_path} size=${spilled.size_bytes}`);

// explicit output_path
const outp = path.join(os.tmpdir(), `bexio-verify-${fid}.bin`);
cleanup.push(outp);
const tofile = await files.download_file(client, { file_id: fid, output_path: outp });
const outOk = tofile.file_path === path.resolve(outp) && fs.existsSync(outp) && fs.statSync(outp).size === tofile.size_bytes;
check("#10 output_path honored", outOk, `path=${tofile.file_path}`);

for (const p of cleanup) { try { if (fs.existsSync(p)) fs.rmSync(p); } catch { /* ignore */ } }
log(`\n=== RESULT: ${pass} passed, ${fail} failed ===`);
process.exit(fail === 0 ? 0 : 1);
