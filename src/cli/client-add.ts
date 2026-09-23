#!/usr/bin/env node
/**
 * Create a gateway access key for a client.
 *
 *   node dist/cli/client-add.js <name> <connection> [--file /config/clients.json]
 *
 * Prints the key once (it is not stored anywhere) and writes its hash to clients.json.
 * Without --file the entry is only printed, e.g. to paste it by hand.
 */

import fs from "node:fs";
import { generateClientKey, hashClientKey, parseClientsConfig } from "../auth/client-config.js";

function usage(): never {
  console.error("Usage: client-add <name> <connection> [--file <clients.json>]");
  process.exit(2);
}

const args = process.argv.slice(2);
const fileIndex = args.indexOf("--file");
const file = fileIndex !== -1 ? args[fileIndex + 1] : undefined;
if (fileIndex !== -1 && !file) usage();
const positional = args.filter((_, i) => i !== fileIndex && i !== fileIndex + 1);
const [name, connection] = positional;
if (!name || !connection) usage();

const key = generateClientKey();
const entry = { keyHash: hashClientKey(key), connection };

if (file) {
  const current = fs.existsSync(file) ? (JSON.parse(fs.readFileSync(file, "utf8") || "{}") as Record<string, unknown>) : {};
  const replaced = name in current;
  current[name] = entry;
  const json = JSON.stringify(current, null, 2) + "\n";
  parseClientsConfig(json);
  fs.writeFileSync(file, json, { mode: 0o644 });
  console.error(`${replaced ? "Replaced" : "Added"} client "${name}" -> connection "${connection}" in ${file}.`);
} else {
  const json = JSON.stringify({ [name]: entry });
  parseClientsConfig(json);
  console.error(`Add this entry to clients.json:\n  "${name}": ${JSON.stringify(entry)}`);
}

console.error("\nAccess key (shown only once, give it to the user):");
console.log(key);
