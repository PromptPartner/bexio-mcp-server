/**
 * The file a tool uploads: either a local file_path the server reads itself (#16), so a
 * receipt never passes through the conversation as base64, or inline content_base64 +
 * name + content_type. Shared by upload_file and attach_file_to_manual_entry.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { resolveLocalPath } from "./path-guard.js";

// Content type for a file_path upload when the caller does not give one.
const CONTENT_TYPES: Record<string, string> = {
  ".pdf": "application/pdf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".heic": "image/heic",
  ".tif": "image/tiff",
  ".tiff": "image/tiff",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".xml": "application/xml",
  ".json": "application/json",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ".zip": "application/zip",
};

export interface UploadSourceParams {
  file_path?: string;
  content_base64?: string;
  name?: string;
  content_type?: string;
}

export interface UploadSource {
  name: string;
  bytes: Buffer;
  contentType: string;
}

/** Resolve the upload to bytes. Callers validate first that exactly one source is given. */
export async function readUploadSource(params: UploadSourceParams): Promise<UploadSource> {
  if (params.file_path) {
    const source = await resolveLocalPath(params.file_path, "read");
    const bytes = await readFile(source);
    const name = params.name ?? path.basename(source);
    const contentType =
      params.content_type ?? CONTENT_TYPES[path.extname(name).toLowerCase()] ?? "application/octet-stream";
    return { name, bytes, contentType };
  }
  return {
    name: params.name!,
    bytes: Buffer.from(params.content_base64!, "base64"),
    contentType: params.content_type!,
  };
}
