/**
 * Helpers for #10: keep large file downloads out of the MCP response.
 *
 * `download_file` used to return the full base64 inline, which overflows the
 * model's context for anything but tiny files. These helpers decide whether a
 * payload is small enough to inline, and otherwise spill it to a real file and
 * return the path. Pure + side-effecting parts are split so the decision logic
 * is unit-testable without touching the filesystem.
 */
import { writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

/** Default inline ceiling (decoded bytes). Overridable via BEXIO_DOWNLOAD_INLINE_MAX_BYTES. */
export const DEFAULT_INLINE_MAX_BYTES = 64_000;

/** True when a payload of `byteLength` decoded bytes is small enough to inline. */
export function shouldInline(byteLength: number, threshold: number): boolean {
  return byteLength <= threshold;
}

/** Resolve the configured inline threshold, falling back to the default. */
export function resolveInlineThreshold(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env["BEXIO_DOWNLOAD_INLINE_MAX_BYTES"];
  const n = raw === undefined ? NaN : Number(raw);
  return Number.isFinite(n) && n >= 0 ? n : DEFAULT_INLINE_MAX_BYTES;
}

/** Reduce an arbitrary filename to a single safe path component (blocks traversal). */
function sanitizeFilename(name: string): string {
  const base = path.basename(name || "").replace(/[^A-Za-z0-9._-]/g, "_");
  return base.length > 0 ? base : "download";
}

/**
 * Write `bytes` either to `outputPath` (if given) or to a uniquely-named file in
 * the OS temp dir, and return the absolute path written. The provided `filename`
 * is sanitized to a single component so it can never escape the temp dir.
 */
export async function writeDownloadToTemp(
  bytes: Buffer,
  filename: string,
  outputPath?: string
): Promise<string> {
  if (outputPath) {
    const resolved = path.resolve(outputPath);
    await writeFile(resolved, bytes);
    return resolved;
  }
  const safe = sanitizeFilename(filename);
  const target = path.join(os.tmpdir(), `bexio-download-${Date.now()}-${safe}`);
  await writeFile(target, bytes);
  return target;
}
