/**
 * Files and Additional Addresses Zod schemas and types.
 * Domain: Files (file) and Additional Addresses (contact/{id}/additional_address)
 */

import { z } from "zod";
import { SearchCriteriaSchema } from "../common.js";

// ===== FILES =====

// List files
export const ListFilesParamsSchema = z.object({
  limit: z.number().int().positive().default(50),
  offset: z.number().int().min(0).default(0),
});

export type ListFilesParams = z.infer<typeof ListFilesParamsSchema>;

// Get single file
export const GetFileParamsSchema = z.object({
  file_id: z.number().int().positive(),
});

export type GetFileParams = z.infer<typeof GetFileParamsSchema>;

// Upload source: either inline base64, or a local file_path the server reads itself
// (#16), so large receipts never pass through the model. Exactly one of the two.
export const UploadSourceShape = {
  file_path: z.string().min(1).optional(),
  content_base64: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  content_type: z.string().min(1).optional(),
};

export function refineUploadSource(
  v: { file_path?: string; content_base64?: string; name?: string; content_type?: string },
  ctx: z.RefinementCtx
): void {
  if (!!v.file_path === !!v.content_base64) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Provide exactly one of file_path or content_base64" });
  }
  if (v.content_base64 && (!v.name || !v.content_type)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "name and content_type are required with content_base64" });
  }
}

export const UploadFileParamsSchema = z.object(UploadSourceShape).superRefine(refineUploadSource);

export type UploadFileParams = z.infer<typeof UploadFileParamsSchema>;

// Download file
export const DownloadFileParamsSchema = z.object({
  file_id: z.number().int().positive(),
  // #10: large files are written to disk instead of returned inline. Optionally
  // choose where; otherwise a temp file is used. In HTTP/n8n mode the path is on
  // the server host, not the MCP client.
  output_path: z.string().min(1).optional(),
});

export type DownloadFileParams = z.infer<typeof DownloadFileParamsSchema>;

// Update file
export const UpdateFileParamsSchema = z.object({
  file_id: z.number().int().positive(),
  file_data: z.record(z.unknown()),
});

export type UpdateFileParams = z.infer<typeof UpdateFileParamsSchema>;

// Delete file
export const DeleteFileParamsSchema = z.object({
  file_id: z.number().int().positive(),
});

export type DeleteFileParams = z.infer<typeof DeleteFileParamsSchema>;

// Search files (v3.0 search criteria)
export const SearchFilesParamsSchema = z.object({
  search_criteria: z.array(SearchCriteriaSchema).min(1),
  archived_state: z.enum(["all", "archived", "not_archived"]).optional(),
  limit: z.number().int().positive().default(50),
  offset: z.number().int().min(0).default(0),
});

export type SearchFilesParams = z.infer<typeof SearchFilesParamsSchema>;

// Where a file is used
export const GetFileUsageParamsSchema = z.object({
  file_id: z.number().int().positive(),
});

export type GetFileUsageParams = z.infer<typeof GetFileUsageParamsSchema>;

// Preview image of a file
export const GetFilePreviewParamsSchema = z.object({
  file_id: z.number().int().positive(),
  output_path: z.string().min(1).optional(),
});

export type GetFilePreviewParams = z.infer<typeof GetFilePreviewParamsSchema>;

// ===== ADDITIONAL ADDRESSES =====

// List additional addresses for a contact
export const ListAdditionalAddressesParamsSchema = z.object({
  contact_id: z.number().int().positive(),
  limit: z.number().int().positive().default(50),
  offset: z.number().int().min(0).default(0),
});

export type ListAdditionalAddressesParams = z.infer<typeof ListAdditionalAddressesParamsSchema>;

// Get single additional address
export const GetAdditionalAddressParamsSchema = z.object({
  contact_id: z.number().int().positive(),
  address_id: z.number().int().positive(),
});

export type GetAdditionalAddressParams = z.infer<typeof GetAdditionalAddressParamsSchema>;

// Create additional address
// bexio's additional-address fields. `address` is read-only on bexio's side; it stays
// accepted here as deprecated and is split into street_name + house_number.
const AdditionalAddressFieldsSchema = z.object({
  name: z.string().optional(),
  name_addition: z.string().optional(),
  street_name: z.string().optional(),
  house_number: z.string().optional(),
  address_addition: z.string().optional(),
  address: z.string().optional(),
  postcode: z.string().optional(),
  city: z.string().optional(),
  country_id: z.number().int().positive().optional(),
  subject: z.string().optional(),
  description: z.string().optional(),
});

export const CreateAdditionalAddressParamsSchema = z.object({
  contact_id: z.number().int().positive(),
  address_data: AdditionalAddressFieldsSchema,
});

export type CreateAdditionalAddressParams = z.infer<typeof CreateAdditionalAddressParamsSchema>;

// Update additional address (REFDATA-15)
export const UpdateAdditionalAddressParamsSchema = z.object({
  contact_id: z.number().int().positive(),
  address_id: z.number().int().positive(),
  address_data: AdditionalAddressFieldsSchema,
});

export type UpdateAdditionalAddressParams = z.infer<typeof UpdateAdditionalAddressParamsSchema>;

// Search additional addresses (REFDATA-15)
export const SearchAdditionalAddressesParamsSchema = z.object({
  contact_id: z.number().int().positive(),
  search_criteria: z.array(SearchCriteriaSchema).min(1),
  limit: z.number().int().positive().default(50),
});

export type SearchAdditionalAddressesParams = z.infer<typeof SearchAdditionalAddressesParamsSchema>;

// Delete additional address
export const DeleteAdditionalAddressParamsSchema = z.object({
  contact_id: z.number().int().positive(),
  address_id: z.number().int().positive(),
});

export type DeleteAdditionalAddressParams = z.infer<typeof DeleteAdditionalAddressParamsSchema>;
