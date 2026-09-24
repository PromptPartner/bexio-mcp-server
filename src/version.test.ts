import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { SERVER_VERSION } from "./version.js";

/**
 * A release bumps the version in several files by hand (PUBLISHING.md). Drift has
 * shipped before: the HTTP transport reported 2.0.0 for three releases and
 * package-lock.json sat at 2.2.0. This fails the suite when any copy disagrees.
 */
const read = (rel: string) => JSON.parse(readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf-8"));

describe("version lockstep", () => {
  const pkg = read("./package.json");
  it.each([
    ["src/version.ts", SERVER_VERSION],
    ["src/package-lock.json", read("./package-lock.json").version],
    ["src/package-lock.json packages['']", read("./package-lock.json").packages[""].version],
    ["server.json", read("../server.json").version],
    ["server.json packages[0]", read("../server.json").packages[0].version],
    ["manifest.json", read("../manifest.json").version],
  ])("%s matches package.json", (_where, version) => {
    expect(version).toBe(pkg.version);
  });

  it("CHANGELOG has a section for this version", () => {
    const changelog = readFileSync(fileURLToPath(new URL("../CHANGELOG.md", import.meta.url)), "utf-8");
    expect(changelog).toContain(`## [${pkg.version}]`);
  });
});
