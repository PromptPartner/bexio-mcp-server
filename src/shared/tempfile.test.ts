import { describe, it, expect, afterAll } from "vitest";
import { readFileSync, existsSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { shouldInline, writeDownloadToTemp } from "./tempfile.js";

const cleanup: string[] = [];
afterAll(() => {
  for (const p of cleanup) if (existsSync(p)) rmSync(p);
});

describe("shouldInline", () => {
  it("inlines when size is below the threshold", () => {
    expect(shouldInline(100, 64_000)).toBe(true);
  });
  it("inlines exactly at the threshold (boundary)", () => {
    expect(shouldInline(64_000, 64_000)).toBe(true);
  });
  it("does NOT inline one byte over the threshold (boundary)", () => {
    expect(shouldInline(64_001, 64_000)).toBe(false);
  });
  it("inlines a zero-byte file", () => {
    expect(shouldInline(0, 64_000)).toBe(true);
  });
});

describe("writeDownloadToTemp", () => {
  it("writes the exact bytes to the OS temp dir and returns an absolute path", async () => {
    const bytes = Buffer.from("hello bexio download", "utf8");
    const p = await writeDownloadToTemp(bytes, "report.pdf");
    cleanup.push(p);
    expect(path.isAbsolute(p)).toBe(true);
    expect(p.startsWith(os.tmpdir())).toBe(true);
    expect(p.endsWith("report.pdf")).toBe(true);
    expect(readFileSync(p).equals(bytes)).toBe(true);
  });

  it("honors an explicit output path", async () => {
    const bytes = Buffer.from([1, 2, 3, 4, 5]);
    const target = path.join(os.tmpdir(), `explicit-${process.pid}.bin`);
    cleanup.push(target);
    const p = await writeDownloadToTemp(bytes, "ignored.bin", target);
    expect(p).toBe(target);
    expect(readFileSync(p).equals(bytes)).toBe(true);
  });

  it("sanitizes path-traversal in the filename so it cannot escape the temp dir", async () => {
    const bytes = Buffer.from("x");
    const p = await writeDownloadToTemp(bytes, "../../../etc/passwd");
    cleanup.push(p);
    expect(p.startsWith(os.tmpdir())).toBe(true);
    expect(p).not.toContain("..");
    expect(path.basename(p).endsWith("passwd")).toBe(true);
  });
});
