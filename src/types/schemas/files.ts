/**
 * Files and Additional Addresses Zod schemas and types.
 * Domain: Files (file) and Additional Addresses (contact/{id}/additional_address)
 */

import { z } from "zod";

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

// Upload file (accepts base64 content for MCP JSON transport)
export const UploadFileParamsSchema = z.object({
  name: z.string().min(1),
  content_base64: z.string().min(1),
  content_type: z.string().min(1),
});

export type UploadFileParams = z.infer<typeof UploadFileParamsSchema>;

// Download file
export const DownloadFileParamsSchema = z.object({
  file_id: z.number().int().positive(),
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
export const CreateAdditionalAddressParamsSchema = z.object({
  contact_id: z.number().int().positive(),
  address_data: z.object({
    name: z.string().optional(),
    address: z.string().optional(),
    postcode: z.string().optional(),
    city: z.string().optional(),
    country_id: z.number().int().positive().optional(),
    subject: z.string().optional(),
    description: z.string().optional(),
  }),
});

export type CreateAdditionalAddressParams = z.infer<typeof CreateAdditionalAddressParamsSchema>;

// Delete additional address
export const DeleteAdditionalAddressParamsSchema = z.object({
  contact_id: z.number().int().positive(),
  address_id: z.number().int().positive(),
});

export type DeleteAdditionalAddressParams = z.infer<typeof DeleteAdditionalAddressParamsSchema>;
