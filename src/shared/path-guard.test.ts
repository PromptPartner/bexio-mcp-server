import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, mkdir, writeFile, symlink, rm, realpath } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { resolveLocalPath, setTransportMode } from "./path-guard.js";

/**
 * upload_file(file_path) reads and download_file(output_path) writes a path chosen by
 * the tool caller. Over stdio that caller is the local user's own MCP client. Over
 * HTTP it is anyone who can reach the port, so an unconfined path would let a remote
 * caller exfiltrate host files to bexio (read) or overwrite them (write).
 */
let root: string;
let allowed: string;
let outside: string;
const savedDir = process.env.BEXIO_FILE_DIR;

beforeEach(async () => {
  root = await realpath(await mkdtemp(path.join(os.tmpdir(), "path-guard-")));
  allowed = path.join(root, "allowed");
  outside = path.join(root, "outside");
  await mkdir(allowed);
  await mkdir(outside);
  await writeFile(path.join(allowed, "in.pdf"), "in");
  await writeFile(path.join(outside, "secret.txt"), "secret");
  delete process.env.BEXIO_FILE_DIR;
});

afterEach(async () => {
  if (savedDir === undefined) delete process.env.BEXIO_FILE_DIR;
  else process.env.BEXIO_FILE_DIR = savedDir;
  setTransportMode(undefined);
  await rm(root, { recursive: true, force: true });
});

describe("resolveLocalPath", () => {
  it("stdio without BEXIO_FILE_DIR: any path, like any local tool", async () => {
    setTransportMode("stdio");
    await expect(resolveLocalPath(path.join(outside, "secret.txt"), "read")).resolves.toBe(
      path.join(outside, "secret.txt")
    );
  });

  it("HTTP without BEXIO_FILE_DIR: refuses local paths", async () => {
    setTransportMode("http");
    await expect(resolveLocalPath(path.join(allowed, "in.pdf"), "read")).rejects.toThrow(/BEXIO_FILE_DIR/);
    await expect(resolveLocalPath(path.join(allowed, "out.pdf"), "write")).rejects.toThrow(/BEXIO_FILE_DIR/);
  });

  it("an unknown transport is treated like HTTP (strict by default)", async () => {
    await expect(resolveLocalPath(path.join(allowed, "in.pdf"), "read")).rejects.toThrow(/BEXIO_FILE_DIR/);
  });

  describe("with BEXIO_FILE_DIR set (both transports)", () => {
    beforeEach(() => {
      process.env.BEXIO_FILE_DIR = allowed;
    });

    it.each(["stdio", "http"] as const)("%s: allows reading and writing inside it", async (mode) => {
      setTransportMode(mode);
      await expect(resolveLocalPath(path.join(allowed, "in.pdf"), "read")).resolves.toBe(path.join(allowed, "in.pdf"));
      await expect(resolveLocalPath(path.join(allowed, "new.pdf"), "write")).resolves.toBe(
        path.join(allowed, "new.pdf")
      );
    });

    it.each(["stdio", "http"] as const)("%s: refuses paths outside it", async (mode) => {
      setTransportMode(mode);
      await expect(resolveLocalPath(path.join(outside, "secret.txt"), "read")).rejects.toThrow(/outside/);
      await expect(resolveLocalPath(path.join(outside, "x.pdf"), "write")).rejects.toThrow(/outside/);
    });

    it("refuses ../ traversal", async () => {
      setTransportMode("http");
      await expect(resolveLocalPath(path.join(allowed, "..", "outside", "secret.txt"), "read")).rejects.toThrow(
        /outside/
      );
    });

    it("refuses a symlink inside the directory that points outside it", async () => {
      setTransportMode("http");
      await symlink(path.join(outside, "secret.txt"), path.join(allowed, "link.txt"));
      await expect(resolveLocalPath(path.join(allowed, "link.txt"), "read")).rejects.toThrow(/outside/);
      await expect(resolveLocalPath(path.join(allowed, "link.txt"), "write")).rejects.toThrow(/outside/);
    });

    it("resolves relative paths against BEXIO_FILE_DIR", async () => {
      setTransportMode("http");
      await expect(resolveLocalPath("in.pdf", "read")).resolves.toBe(path.join(allowed, "in.pdf"));
    });
  });

  it("read refuses something that is not a regular file", async () => {
    setTransportMode("stdio");
    await expect(resolveLocalPath(allowed, "read")).rejects.toThrow(/not a regular file/);
  });
});
