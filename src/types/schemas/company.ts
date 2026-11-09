/**
 * Company and payments config Zod schemas and types.
 * Domain: Company Profile, Permissions, Payment Types
 */

import { z } from "zod";

// ===== COMPANY PROFILE (REFDATA-09) =====

export const GetCompanyProfileParamsSchema = z.object({
  profile_id: z.number().int().positive().optional(),
});

export type GetCompanyProfileParams = z.infer<typeof GetCompanyProfileParamsSchema>;

export const UpdateCompanyProfileParamsSchema = z.object({
  profile_data: z.record(z.unknown()),
});

export type UpdateCompanyProfileParams = z.infer<typeof UpdateCompanyProfileParamsSchema>;

// ===== PERMISSIONS (REFDATA-10) =====

export const ListPermissionsParamsSchema = z.object({});

export type ListPermissionsParams = z.infer<typeof ListPermissionsParamsSchema>;

// ===== PAYMENT TYPES (REFDATA-08) =====

export const ListPaymentTypesParamsSchema = z.object({
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

export type ListPaymentTypesParams = z.infer<typeof ListPaymentTypesParamsSchema>;

export const GetPaymentTypeParamsSchema = z.object({
  payment_type_id: z.number().int().positive(),
});

export type GetPaymentTypeParams = z.infer<typeof GetPaymentTypeParamsSchema>;

export const CreatePaymentTypeParamsSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export type CreatePaymentTypeParams = z.infer<typeof CreatePaymentTypeParamsSchema>;

export const SearchPaymentTypesParamsSchema = z.object({
  query: z.string().min(1, "Query is required"),
  limit: z.number().int().positive().default(100),
});
export type SearchPaymentTypesParams = z.infer<typeof SearchPaymentTypesParamsSchema>;
