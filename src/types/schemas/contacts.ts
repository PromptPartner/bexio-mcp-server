/**
 * Contact-related Zod schemas and types.
 * Domain: Contacts (CRM)
 */

import { z } from "zod";
import { SearchCriteriaSchema, PaginationParams } from "../common.js";

// List contacts with optional filtering
export const ListContactsParamsSchema = z.object({
  limit: z.number().int().positive().default(50),
  offset: z.number().int().min(0).default(0),
  search_term: z.string().optional(),
  contact_type_id: z.number().int().positive().optional(),
});

export type ListContactsParams = z.infer<typeof ListContactsParamsSchema>;

// Get single contact
export const GetContactParamsSchema = z.object({
  contact_id: z.number().int().positive(),
});

export type GetContactParams = z.infer<typeof GetContactParamsSchema>;

// Simple search
export const SearchContactsParamsSchema = z.object({
  query: z.string().min(1, "Query is required"),
  limit: z.number().int().positive().default(50),
});

export type SearchContactsParams = z.infer<typeof SearchContactsParamsSchema>;

// Advanced search with multiple criteria
export const AdvancedSearchContactsParamsSchema = z.object({
  search_criteria: z
    .array(SearchCriteriaSchema)
    .min(1, "At least one search criterion is required"),
  limit: z.number().int().positive().default(50),
});

export type AdvancedSearchContactsParams = z.infer<
  typeof AdvancedSearchContactsParamsSchema
>;

// Find by contact number (e.g., '001008')
export const FindContactByNumberParamsSchema = z.object({
  contact_number: z.string().min(1, "Contact number is required"),
});

export type FindContactByNumberParams = z.infer<
  typeof FindContactByNumberParamsSchema
>;

// Find by name
export const FindContactByNameParamsSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export type FindContactByNameParams = z.infer<
  typeof FindContactByNameParamsSchema
>;

// Update contact
export const UpdateContactParamsSchema = z.object({
  contact_id: z.number().int().positive(),
  contact_data: z.record(z.unknown()),
});

export type UpdateContactParams = z.infer<typeof UpdateContactParamsSchema>;

// Shared fields for creating a contact (used by both single and bulk create)
export const ContactCreateFieldsSchema = z.object({
  contact_type: z.enum(["person", "company"]),
  name_1: z.string().min(1, "name_1 is required (last name for person, company name for company)"),
  name_2: z.string().optional(),
  mail: z.string().optional(),
  phone_fixed: z.string().optional(),
  phone_mobile: z.string().optional(),
  fax: z.string().optional(),
  url: z.string().optional(),
  street_name: z.string().optional(),
  house_number: z.string().optional(),
  address_addition: z.string().optional(),
  /** Deprecated: bexio has no `address` field. Split into street_name + house_number. */
  address: z.string().optional(),
  postcode: z.string().optional(),
  city: z.string().optional(),
  country_id: z.number().int().positive().optional(),
  salutation_id: z.number().int().positive().optional(),
  title_id: z.number().int().positive().optional(),
  birthday: z.string().optional(),
  remarks: z.string().optional(),
  language_id: z.number().int().positive().optional(),
  contact_group_ids: z.array(z.number().int().positive()).optional(),
  sector_id: z.number().int().positive().optional(),
  user_id: z.number().int().positive().optional(),
});

/**
 * Split a one-line street address ("Bahnhofstrasse 12a", "Rue du Lac 3-5") into
 * bexio's street_name + house_number. Without a trailing number ("Postfach",
 * "12 Main Street") the whole line becomes street_name.
 */
export function splitStreetAddress(address: string): { street_name: string; house_number?: string } {
  const m = address.trim().match(/^(.*\S)\s+(\d+(?:\s?[a-zA-Z])?(?:\s?[-/]\s?\d+[a-zA-Z]?)?)$/);
  return m ? { street_name: m[1], house_number: m[2] } : { street_name: address.trim() };
}

/**
 * bexio rejects `address` with an empty 422 (#17). Map a caller's `address` onto
 * street_name + house_number; explicit street_name / house_number always win.
 */
export function normalizeContactAddress<T extends Record<string, unknown>>(fields: T): Omit<T, "address"> {
  const { address, ...rest } = fields as T & { address?: unknown };
  if (typeof address !== "string" || !address.trim() || rest["street_name"] !== undefined) return rest;
  const { street_name, house_number } = splitStreetAddress(address);
  return {
    ...rest,
    street_name,
    ...(house_number !== undefined && rest["house_number"] === undefined ? { house_number } : {}),
  };
}

// Create a single contact
export const CreateContactParamsSchema = ContactCreateFieldsSchema;
export type CreateContactParams = z.infer<typeof CreateContactParamsSchema>;

// Delete a contact (soft delete)
export const DeleteContactParamsSchema = z.object({
  contact_id: z.number().int().positive(),
});
export type DeleteContactParams = z.infer<typeof DeleteContactParamsSchema>;

// Bulk create contacts
export const BulkCreateContactsParamsSchema = z.object({
  contacts: z.array(ContactCreateFieldsSchema).min(1).max(50),
});
export type BulkCreateContactsParams = z.infer<typeof BulkCreateContactsParamsSchema>;

// Restore a deleted contact
export const RestoreContactParamsSchema = z.object({
  contact_id: z.number().int().positive(),
});
export type RestoreContactParams = z.infer<typeof RestoreContactParamsSchema>;

// Search params interface for client methods
export interface ContactSearchParams extends PaginationParams {
  search_term?: string;
  contact_type_id?: number;
}
