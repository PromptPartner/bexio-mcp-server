import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { esc } from "./esc.js";

describe("esc", () => {
  it("neutralizes markup and attribute breakouts", () => {
    expect(esc(`<img src=x onerror="alert(1)">`)).toBe("&lt;img src=x onerror=&quot;alert(1)&quot;&gt;");
    expect(esc(`a' onmouseover='x`)).toBe("a&#39; onmouseover=&#39;x");
    expect(esc("Müller & Söhne AG")).toBe("Müller &amp; Söhne AG");
  });

  it("renders null/undefined as empty and numbers as text", () => {
    expect(esc(null)).toBe("");
    expect(esc(undefined)).toBe("");
    expect(esc(42)).toBe("42");
  });
});

/**
 * Guard: every ${...} in a panel's markup must be esc(...)-wrapped, unless it is one
 * of the reviewed safe shapes: a condition that opens a nested template, a helper's
 * `return` template (escaped where it is used), or a class/label chosen in code.
 * A new raw data interpolation fails here instead of shipping an XSS.
 */
const REVIEWED_STATIC = new Set(["${typeClass}", "${typeBadge}", "${status.className}"]);

describe("UI panels escape every data interpolation", () => {
  const uiDir = fileURLToPath(new URL("..", import.meta.url));
  const panels = readdirSync(uiDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && d.name !== "shared")
    .map((d) => d.name);

  it.each(panels)("%s", (panel) => {
    const src = readFileSync(`${uiDir}/${panel}/mcp-app.ts`, "utf-8");
    const offenders: string[] = [];
    src.split("\n").forEach((line, i) => {
      for (const m of line.matchAll(/\$\{[^}]*\}?/g)) {
        const expr = m[0];
        if (expr.startsWith("${esc(")) continue;
        if (/^\$\{[^`]*\?\s*`/.test(line.slice(m.index))) continue; // `${cond ? `...` (fragment checked on its own)
        if (/\.map\(/.test(expr)) continue; // `${list.map(x => `  (items escaped inside)
        if (/^\s*(default:\s*)?return\b/.test(line)) continue; // helper output, escaped at call site
        if (REVIEWED_STATIC.has(expr)) continue;
        offenders.push(`${panel}/mcp-app.ts:${i + 1}: ${expr}`);
      }
    });
    expect(offenders).toEqual([]);
  });
});
