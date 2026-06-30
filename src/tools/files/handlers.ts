/**
 * Files and Additional Addresses tool handlers.
 * Implements the logic for each files domain tool.
 */

import { BexioClient } from "../../bexio-client.js";
import { McpError } from "../../shared/errors.js";
import { shouldInline, writeDownloadToTemp, resolveInlineThreshold } from "../../shared/tempfile.js";
import {
  ListFilesParamsSchema,
  GetFileParamsSchema,
  UploadFileParamsSchema,
  DownloadFileParamsSchema,
  UpdateFileParamsSchema,
  DeleteFileParamsSchema,
  ListAdditionalAddressesParamsSchema,
  GetAdditionalAddressParamsSchema,
  CreateAdditionalAddressParamsSchema,
  UpdateAdditionalAddressParamsSchema,
  SearchAdditionalAddressesParamsSchema,
  DeleteAdditionalAddressParamsSchema,
} from "../../types/index.js";

export type HandlerFn = (
  client: BexioClient,
  args: unknown
) => Promise<unknown>;

export const handlers: Record<string, HandlerFn> = {
  // ===== FILES =====
  list_files: async (client, args) => {
    const params = ListFilesParamsSchema.parse(args);
    return client.listFiles(params);
  },

  get_file: async (client, args) => {
    const { file_id } = GetFileParamsSchema.parse(args);
    const file = await client.getFile(file_id);
    if (!file) {
      throw McpError.notFound("File", file_id);
    }
    return file;
  },

  upload_file: async (client, args) => {
    const params = UploadFileParamsSchema.parse(args);
    return client.uploadFile(params);
  },

  download_file: async (client, args) => {
    const { file_id, output_path } = DownloadFileParamsSchema.parse(args);
    const content_base64 = await client.downloadFile(file_id);
    const bytes = Buffer.from(content_base64, "base64");
    const size_bytes = bytes.length;
    const threshold = resolveInlineThreshold();

    // Best-effort real filename + mime; never let metadata failure break download.
    let filename = `file-${file_id}`;
    let content_type: string | undefined;
    try {
      const meta = (await client.getFile(file_id)) as Record<string, unknown> | null;
      if (meta) {
        if (typeof meta["name"] === "string" && meta["name"]) filename = meta["name"];
        if (typeof meta["mime_type"] === "string") content_type = meta["mime_type"];
      }
    } catch {
      /* metadata is optional */
    }

    // Small file with no explicit destination → keep the backward-compatible
    // inline shape so existing callers still get content_base64.
    if (!output_path && shouldInline(size_bytes, threshold)) {
      return {
        file_id,
        content_base64,
        size_bytes,
        content_type,
        filename,
        message: `File content returned inline as base64 (${size_bytes} bytes; inline threshold ${threshold} bytes).`,
      };
    }

    // Otherwise spill to disk and return a path instead of the base64 blob.
    const file_path = await writeDownloadToTemp(bytes, filename, output_path);
    return {
      file_id,
      file_path,
      size_bytes,
      content_type,
      filename,
      message: output_path
        ? `File written to the requested path (${size_bytes} bytes). In HTTP/n8n mode this path is on the SERVER host, not the MCP client.`
        : `File (${size_bytes} bytes) exceeded the inline threshold (${threshold} bytes) and was written to a temp file. In HTTP/n8n mode this path is on the SERVER host. Pass output_path to choose a location, or raise BEXIO_DOWNLOAD_INLINE_MAX_BYTES to inline larger files.`,
    };
  },

  update_file: async (client, args) => {
    const { file_id, file_data } = UpdateFileParamsSchema.parse(args);
    return client.updateFile(file_id, file_data);
  },

  delete_file: async (client, args) => {
    const { file_id } = DeleteFileParamsSchema.parse(args);
    return client.deleteFile(file_id);
  },

  // ===== ADDITIONAL ADDRESSES =====
  list_additional_addresses: async (client, args) => {
    const { contact_id, limit, offset } = ListAdditionalAddressesParamsSchema.parse(args);
    return client.listAdditionalAddresses(contact_id, { limit, offset });
  },

  get_additional_address: async (client, args) => {
    const { contact_id, address_id } = GetAdditionalAddressParamsSchema.parse(args);
    const address = await client.getAdditionalAddress(contact_id, address_id);
    if (!address) {
      throw McpError.notFound("Additional Address", address_id);
    }
    return address;
  },

  create_additional_address: async (client, args) => {
    const { contact_id, address_data } = CreateAdditionalAddressParamsSchema.parse(args);
    return client.createAdditionalAddress(contact_id, address_data);
  },

  update_additional_address: async (client, args) => {
    const { contact_id, address_id, address_data } = UpdateAdditionalAddressParamsSchema.parse(args);
    return client.updateAdditionalAddress(contact_id, address_id, address_data);
  },

  search_additional_addresses: async (client, args) => {
    const { contact_id, search_criteria, limit } = SearchAdditionalAddressesParamsSchema.parse(args);
    return client.searchAdditionalAddresses(contact_id, search_criteria, limit);
  },

  delete_additional_address: async (client, args) => {
    const { contact_id, address_id } = DeleteAdditionalAddressParamsSchema.parse(args);
    return client.deleteAdditionalAddress(contact_id, address_id);
  },
};
