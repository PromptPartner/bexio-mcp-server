import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { BexioClient } from "./bexio-client.js";
import { setTransportMode } from "./shared/path-guard.js";
import { handlers as accounting } from "./tools/accounting/handlers.js";
import { handlers as files } from "./tools/files/handlers.js";

/**
 * Receipts on manual entries (v3.0): bexio keeps them per posting line for single and
 * group entries (/manual_entries/{id}/entries/{line_id}/files) and on the entry itself
 * for compound entries (/manual_entries/{id}/files). Plus the file endpoints that tell
 * where a file is attached (usage), search and preview.
 */
type Call = { method: string; endpoint: string; params?: unknown; data?: unknown };

function recordingClient(response: unknown = []) {
  const client = new BexioClient({ apiToken: "test" } as never);
  const calls: Call[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = client as any;
  c.makeVersionedRequest = async (version: string, method: string, endpoint: string, params?: unknown, data?: unknown) => {
    calls.push({ method, endpoint: `/${version}/${endpoint}`, params, data });
    return response;
  };
  c.postMultipartFile = async (endpoint: string, name: string, bytes: Buffer, contentType: string) => {
    calls.push({ method: "POST multipart", endpoint: `/3.0/${endpoint}`, data: { name, size: bytes.length, contentType } });
    return [{ id: 99, name, data: bytes.toString("base64") }];
  };
  c.getFilePreview = async (fileId: number) => {
    calls.push({ method: "GET", endpoint: `/3.0/files/${fileId}/preview` });
    return { bytes: Buffer.from("jpeg-bytes"), contentType: "image/jpeg" };
  };
  return { client, calls };
}

let dir: string;
let receipt: string;

beforeAll(async () => {
  setTransportMode("stdio");
  dir = await mkdtemp(path.join(os.tmpdir(), "bexio-me-files-"));
  receipt = path.join(dir, "2024-12-31_Lieferant_Rechnung.pdf");
  await writeFile(receipt, "%PDF-1.4 test");
});

afterAll(async () => {
  setTransportMode(undefined);
  await rm(dir, { recursive: true, force: true });
});

describe("manual entry files: line vs. compound entry paths", () => {
  it("lists the files of a posting line", async () => {
    const { client, calls } = recordingClient();
    await accounting.list_manual_entry_files(client, { manual_entry_id: 21, line_id: 115 });
    expect(calls[0]).toMatchObject({ method: "GET", endpoint: "/3.0/accounting/manual_entries/21/entries/115/files" });
  });

  it("lists the files of a compound entry without line_id", async () => {
    const { client, calls } = recordingClient();
    await accounting.list_manual_entry_files(client, { manual_entry_id: 21 });
    expect(calls[0]).toMatchObject({ method: "GET", endpoint: "/3.0/accounting/manual_entries/21/files" });
  });

  it("detaches with DELETE on the file link", async () => {
    const { client, calls } = recordingClient({ success: true });
    await accounting.detach_file_from_manual_entry(client, { manual_entry_id: 21, line_id: 115, file_id: 10 });
    expect(calls).toEqual([
      expect.objectContaining({ method: "DELETE", endpoint: "/3.0/accounting/manual_entries/21/entries/115/files/10" }),
    ]);
  });

  it("gets the next reference number", async () => {
    const { client, calls } = recordingClient({ next_ref_nr: "42" });
    expect(await accounting.get_next_manual_entry_ref_nr(client, {})).toEqual({ next_ref_nr: "42" });
    expect(calls[0]).toMatchObject({ method: "GET", endpoint: "/3.0/accounting/manual_entries/next_ref_nr" });
  });
});

describe("get_manual_entry_file keeps the base64 content out of the response", () => {
  it("drops bexio's data field", async () => {
    const { client } = recordingClient({ id: 10, name: "Beleg", mime_type: "application/pdf", data: "JVBERi0x..." });
    const result = (await accounting.get_manual_entry_file(client, { manual_entry_id: 21, line_id: 115, file_id: 10 })) as Record<string, unknown>;
    expect(result).toMatchObject({ id: 10, name: "Beleg" });
    expect(result).not.toHaveProperty("data");
  });
});

describe("attach_file_to_manual_entry", () => {
  it("uploads a local file to the posting line", async () => {
    const { client, calls } = recordingClient();
    await accounting.attach_file_to_manual_entry(client, { manual_entry_id: 21, line_id: 115, file_path: receipt });
    expect(calls).toEqual([
      {
        method: "POST multipart",
        endpoint: "/3.0/accounting/manual_entries/21/entries/115/files",
        data: { name: "2024-12-31_Lieferant_Rechnung.pdf", size: 13, contentType: "application/pdf" },
      },
    ]);
  });

  it("returns the created file without bexio's base64 content", async () => {
    const { client } = recordingClient();
    const result = await accounting.attach_file_to_manual_entry(client, { manual_entry_id: 21, line_id: 115, file_path: receipt });
    expect(result).toEqual([expect.objectContaining({ id: 99, name: "2024-12-31_Lieferant_Rechnung.pdf" })]);
    expect((result as Array<Record<string, unknown>>)[0]).not.toHaveProperty("data");
  });

  it("accepts inline base64 with name and content_type", async () => {
    const { client, calls } = recordingClient();
    await accounting.attach_file_to_manual_entry(client, {
      manual_entry_id: 21,
      content_base64: Buffer.from("abc").toString("base64"),
      name: "scan.png",
      content_type: "image/png",
    });
    expect(calls[0]).toMatchObject({ endpoint: "/3.0/accounting/manual_entries/21/files", data: { name: "scan.png", size: 3 } });
  });

  it("requires exactly one source", async () => {
    const { client, calls } = recordingClient();
    await expect(accounting.attach_file_to_manual_entry(client, { manual_entry_id: 21, line_id: 115 })).rejects.toThrow(
      /exactly one of file_path or content_base64/
    );
    expect(calls).toEqual([]);
  });
});

describe("file search, usage and preview", () => {
  it("search_files posts the criteria and passes archived_state", async () => {
    const { client, calls } = recordingClient();
    const criteria = [{ field: "name", value: "Rechnung", criteria: "like" }];
    await files.search_files(client, { search_criteria: criteria, archived_state: "all" });
    expect(calls[0]).toEqual({
      method: "POST",
      endpoint: "/3.0/files/search",
      params: { limit: 50, offset: 0, archived_state: "all" },
      data: criteria,
    });
  });

  it("get_file_usage asks bexio where the file is attached", async () => {
    const { client, calls } = recordingClient([{ id: 21, ref_class: "journal_entry" }]);
    expect(await files.get_file_usage(client, { file_id: 10 })).toEqual([{ id: 21, ref_class: "journal_entry" }]);
    expect(calls[0]).toMatchObject({ method: "GET", endpoint: "/3.0/files/10/usage" });
  });

  it("get_file_preview returns a small preview inline", async () => {
    const { client } = recordingClient();
    const result = (await files.get_file_preview(client, { file_id: 10 })) as Record<string, unknown>;
    expect(result).toMatchObject({ file_id: 10, content_type: "image/jpeg", content_base64: Buffer.from("jpeg-bytes").toString("base64") });
  });
});
