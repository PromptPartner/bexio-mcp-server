#!/usr/bin/env node
/**
 * Build the MCP App panels (ui/<name>/<name>.html), one Vite build per panel, and fail
 * unless every panel is a single self-contained HTML document.
 *
 * A panel is served as an MCP resource (ui://bexio/<name>.html): one HTML text, no
 * sibling files. With several inputs in one build, Rollup hoists code the panels share
 * (the MCP Apps client, the esc() helper) into a separate chunk that the single-file
 * plugin cannot inline, so every panel imported a file that was never shipped and
 * failed to load (true from the first release of the panels up to 2.6.0).
 */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const uiDir = "ui";
const outDir = path.join("dist", "ui");
if (!fs.existsSync(uiDir)) {
  console.log("Skipping UI build - ui/ not found");
  process.exit(0);
}

const panels = fs
  .readdirSync(uiDir, { withFileTypes: true })
  .filter((d) => d.isDirectory() && fs.existsSync(path.join(uiDir, d.name, `${d.name}.html`)))
  .map((d) => d.name);

fs.rmSync(outDir, { recursive: true, force: true });
for (const name of panels) {
  execSync("npx vite build", { stdio: "inherit", env: { ...process.env, UI_ENTRY: name } });
}

// Verify: exactly one HTML per panel, nothing else emitted, no external module refs.
const problems = [];
const emitted = [];
const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).forEach((e) => {
    const p = path.join(dir, e.name);
    e.isDirectory() ? walk(p) : emitted.push(path.relative(outDir, p));
  });
walk(outDir);
const expected = panels.map((n) => path.join("ui", n, `${n}.html`));
for (const f of emitted) if (!expected.includes(f)) problems.push(`unexpected file emitted: ${f}`);
for (const f of expected) {
  const file = path.join(outDir, f);
  if (!fs.existsSync(file)) {
    problems.push(`missing panel: ${f}`);
    continue;
  }
  const html = fs.readFileSync(file, "utf-8");
  if (/<script[^>]*\ssrc=/.test(html)) problems.push(`${f}: external <script src>`);
  if (/<link[^>]*rel=["']?modulepreload/.test(html)) problems.push(`${f}: modulepreload link to a separate chunk`);
  if (/(?:^|[;\s}>])import\s*(?:[\w{},*$\s]+from\s*)?["']\.{1,2}\//m.test(html)) problems.push(`${f}: imports a relative module`);
}

if (problems.length) {
  console.error(`\nUI panels are not self-contained:\n  - ${problems.join("\n  - ")}`);
  process.exit(1);
}
console.log(`UI panels OK: ${panels.length} self-contained HTML files (${expected.join(", ")})`);
