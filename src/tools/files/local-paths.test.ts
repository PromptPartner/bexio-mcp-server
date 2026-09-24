import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mkdtemp, writeFile, rm, realpath, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { handlers } from "./handlers.js";
import { setTransportMode } from "../../shared/path-guard.js";

/**
 * #16: upload_file takes a local file_path, so a receipt PDF never has to pass
 * through the model as base64. Reads and writes go through the path guard.
 */
let dir: string;
const PDF = Buffer.from("%PDF-1.4 fake receipt");

function captureClient() {
  const uploads: Array<{ name: string; bytes: Buffer; content_type: string }> = [];
  const client = {
    uploadFileBuffer: async (name: string, bytes: Buffer, content_type: string) => {
      uploads.push({ name, bytes, content_type });
      return { id: 1, uuid: "u-1" };
    },
    uploadFile: async (data: { name: string; content_base64: string; content_type: string }) => {
      uploads.push({ name: data.name, bytes: Buffer.from(data.content_base64, "base64"), content_type: data.content_type });
      return { id: 2 };
    },
    downloadFile: async () => PDF.toString("base64"),
    getFile: async () => ({ name: "receipt.pdf", mime_type: "application/pdf" }),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { client: client as any, uploads };
}

beforeEach(async () => {
  dir = await realpath(await mkdtemp(path.join(os.tmpdir(), "files-")));
  await writeFile(path.join(dir, "Receipt 2026-09.pdf"), PDF);
  delete process.env.BEXIO_FILE_DIR;
});
afterEach(async () => {
  setTransportMode(undefined);
  delete process.env.BEXIO_FILE_DIR;
  await rm(dir, { recursive: true, force: true });
});

describe("upload_file", () => {
  it("reads file_path from disk; name and content type default from the file", async () => {
    setTransportMode("stdio");
    const { client, uploads } = captureClient();
    await handlers.upload_file(client, { file_path: path.join(dir, "Receipt 2026-09.pdf") });
    expect(uploads).toHaveLength(1);
    expect(uploads[0].name).toBe("Receipt 2026-09.pdf");
    expect(uploads[0].content_type).toBe("application/pdf");
    expect(uploads[0].bytes.equals(PDF)).toBe(true);
  });

  it("lets the caller override name and content_type", async () => {
    setTransportMode("stdio");
    const { client, uploads } = captureClient();
    await handlers.upload_file(client, {
      file_path: path.join(dir, "Receipt 2026-09.pdf"),
      name: "bill-4711.pdf",
      content_type: "application/x-pdf",
    });
    expect(uploads[0]).toMatchObject({ name: "bill-4711.pdf", content_type: "application/x-pdf" });
  });

  it("still accepts inline base64", async () => {
    const { client, uploads } = captureClient();
    await handlers.upload_file(client, { name: "a.txt", content_base64: "YQ==", content_type: "text/plain" });
    expect(uploads[0]).toMatchObject({ name: "a.txt", content_type: "text/plain" });
  });

  it("requires exactly one of file_path and content_base64", async () => {
    const { client, uploads } = captureClient();
    await expect(handlers.upload_file(client, { name: "a.txt", content_type: "text/plain" })).rejects.toThrow();
    await expect(
      handlers.upload_file(client, {
        file_path: path.join(dir, "Receipt 2026-09.pdf"),
        content_base64: "YQ==",
        name: "a.txt",
        content_type: "text/plain",
      })
    ).rejects.toThrow();
    expect(uploads).toHaveLength(0);
  });

  it("inline base64 still needs name and content_type", async () => {
    const { client } = captureClient();
    await expect(handlers.upload_file(client, { content_base64: "YQ==" })).rejects.toThrow();
  });

  it("over HTTP without BEXIO_FILE_DIR, refuses file_path and uploads nothing", async () => {
    setTransportMode("http");
    const { client, uploads } = captureClient();
    await expect(handlers.upload_file(client, { file_path: path.join(dir, "Receipt 2026-09.pdf") })).rejects.toThrow(
      /BEXIO_FILE_DIR/
    );
    expect(uploads).toHaveLength(0);
  });
});

describe("download_file output_path", () => {
  it("over HTTP without BEXIO_FILE_DIR, refuses output_path", async () => {
    setTransportMode("http");
    const { client } = captureClient();
    await expect(
      handlers.download_file(client, { file_id: 1, output_path: path.join(dir, "out.pdf") })
    ).rejects.toThrow(/BEXIO_FILE_DIR/);
  });

  it("writes inside BEXIO_FILE_DIR over HTTP", async () => {
    setTransportMode("http");
    process.env.BEXIO_FILE_DIR = dir;
    const { client } = captureClient();
    const res = (await handlers.download_file(client, { file_id: 1, output_path: "out.pdf" })) as { file_path: string };
    expect(res.file_path).toBe(path.join(dir, "out.pdf"));
    expect((await readFile(res.file_path)).equals(PDF)).toBe(true);
  });

  it("stdio keeps writing wherever the local user asks", async () => {
    setTransportMode("stdio");
    const { client } = captureClient();
    const target = path.join(dir, "anywhere.pdf");
    const res = (await handlers.download_file(client, { file_id: 1, output_path: target })) as { file_path: string };
    expect(res.file_path).toBe(target);
  });
});
