/**
 * Confinement for tool-supplied local paths: upload_file's `file_path` (read) and
 * download_file's `output_path` (write).
 *
 * Over stdio the tool caller is the local user's own MCP client, so a path is theirs
 * to choose, like with any local tool. Over HTTP the caller is anyone who can reach
 * the port; an unconfined path would let them upload host files (SSH keys, .env
 * tokens) to bexio or overwrite files on the host. So:
 *   - BEXIO_FILE_DIR set   -> paths must resolve (after symlinks) inside it, any transport
 *   - unset, stdio         -> any path
 *   - unset, HTTP/unknown  -> local paths refused
 */
import { realpath, stat } from "node:fs/promises";
import path from "node:path";
import { McpError } from "./errors.js";

export type TransportMode = "stdio" | "http";

let transportMode: TransportMode | undefined;

/** Called by index.ts once the transport is chosen. Unset is treated as HTTP. */
export function setTransportMode(mode: TransportMode | undefined): void {
  transportMode = mode;
}

function isInside(base: string, target: string): boolean {
  const rel = path.relative(base, target);
  return rel !== "" && !rel.startsWith("..") && !path.isAbsolute(rel);
}

async function realpathOrNull(p: string): Promise<string | null> {
  try {
    return await realpath(p);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

async function assertRegularFile(p: string, original: string): Promise<void> {
  let s;
  try {
    s = await stat(p);
  } catch {
    throw McpError.validation(`File not found: ${original}`);
  }
  if (!s.isFile()) throw McpError.validation(`${original} is not a regular file`);
}

/**
 * Resolve a caller-supplied local path for reading or writing, enforcing the rules
 * above. Returns the absolute (for BEXIO_FILE_DIR: symlink-resolved) path to use.
 */
export async function resolveLocalPath(p: string, purpose: "read" | "write"): Promise<string> {
  const dir = process.env["BEXIO_FILE_DIR"]?.trim();

  if (!dir) {
    if (transportMode !== "stdio") {
      throw McpError.validation(
        "Local file paths are disabled in HTTP mode because any client that can reach the server could read or overwrite files on the host. Set BEXIO_FILE_DIR to a directory to allow paths inside it"
      );
    }
    const abs = path.resolve(p);
    if (purpose === "read") await assertRegularFile(abs, p);
    return abs;
  }

  const base = await realpathOrNull(path.resolve(dir));
  if (!base) throw McpError.validation(`BEXIO_FILE_DIR does not exist: ${dir}`);

  const abs = path.resolve(base, p);
  let real = await realpathOrNull(abs);
  if (real === null) {
    if (purpose === "read") throw McpError.validation(`File not found: ${p}`);
    // A new file: resolve its directory instead (it must exist and be inside).
    const parent = await realpathOrNull(path.dirname(abs));
    if (!parent) throw McpError.validation(`Directory does not exist: ${path.dirname(abs)}`);
    real = path.join(parent, path.basename(abs));
  }

  if (!isInside(base, real)) {
    throw McpError.validation(`${p} is outside BEXIO_FILE_DIR (${base})`);
  }
  if (purpose === "read") await assertRegularFile(real, p);
  return real;
}
