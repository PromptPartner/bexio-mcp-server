/**
 * Reference data Zod schemas and types.
 * Domain: Reference Data (Contact Groups, Sectors, Salutations, Titles, Countries, Languages, Units)
 */

import { z } from "zod";

// ===== CONTACT GROUPS (REFDATA-01) =====

export const ListContactGroupsParamsSchema = z.object({
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

export type ListContactGroupsParams = z.infer<typeof ListContactGroupsParamsSchema>;

export const GetContactGroupParamsSchema = z.object({
  group_id: z.number().int().positive(),
});

export type GetContactGroupParams = z.infer<typeof GetContactGroupParamsSchema>;

export const CreateContactGroupParamsSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export type CreateContactGroupParams = z.infer<typeof CreateContactGroupParamsSchema>;

export const DeleteContactGroupParamsSchema = z.object({
  group_id: z.number().int().positive(),
});

export type DeleteContactGroupParams = z.infer<typeof DeleteContactGroupParamsSchema>;

// Update contact group (REFDATA-11)
export const UpdateContactGroupParamsSchema = z.object({
  group_id: z.number().int().positive(),
  name: z.string().min(1, "Name is required"),
});

export type UpdateContactGroupParams = z.infer<typeof UpdateContactGroupParamsSchema>;

// Search contact groups (REFDATA-11)
export const SearchContactGroupsParamsSchema = z.object({
  query: z.string().min(1, "Query is required"),
  limit: z.number().int().positive().default(100),
});

export type SearchContactGroupsParams = z.infer<typeof SearchContactGroupsParamsSchema>;

// ===== CONTACT SECTORS (REFDATA-02) =====

export const ListContactSectorsParamsSchema = z.object({
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

export type ListContactSectorsParams = z.infer<typeof ListContactSectorsParamsSchema>;

export const GetContactSectorParamsSchema = z.object({
  sector_id: z.number().int().positive(),
});

export type GetContactSectorParams = z.infer<typeof GetContactSectorParamsSchema>;

export const CreateContactSectorParamsSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export type CreateContactSectorParams = z.infer<typeof CreateContactSectorParamsSchema>;

// Search contact sectors (REFDATA-12)
export const SearchContactSectorsParamsSchema = z.object({
  query: z.string().min(1, "Query is required"),
  limit: z.number().int().positive().default(100),
});

export type SearchContactSectorsParams = z.infer<typeof SearchContactSectorsParamsSchema>;

// ===== SALUTATIONS (REFDATA-03) =====

export const ListSalutationsParamsSchema = z.object({
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

export type ListSalutationsParams = z.infer<typeof ListSalutationsParamsSchema>;

export const GetSalutationParamsSchema = z.object({
  salutation_id: z.number().int().positive(),
});

export type GetSalutationParams = z.infer<typeof GetSalutationParamsSchema>;

export const CreateSalutationParamsSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export type CreateSalutationParams = z.infer<typeof CreateSalutationParamsSchema>;

export const DeleteSalutationParamsSchema = z.object({
  salutation_id: z.number().int().positive(),
});

export type DeleteSalutationParams = z.infer<typeof DeleteSalutationParamsSchema>;

// Update salutation (REFDATA-13)
export const UpdateSalutationParamsSchema = z.object({
  salutation_id: z.number().int().positive(),
  name: z.string().min(1, "Name is required"),
});

export type UpdateSalutationParams = z.infer<typeof UpdateSalutationParamsSchema>;

// Search salutations (REFDATA-13)
export const SearchSalutationsParamsSchema = z.object({
  query: z.string().min(1, "Query is required"),
  limit: z.number().int().positive().default(100),
});

export type SearchSalutationsParams = z.infer<typeof SearchSalutationsParamsSchema>;

// ===== TITLES (REFDATA-04) =====

export const ListTitlesParamsSchema = z.object({
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

export type ListTitlesParams = z.infer<typeof ListTitlesParamsSchema>;

export const GetTitleParamsSchema = z.object({
  title_id: z.number().int().positive(),
});

export type GetTitleParams = z.infer<typeof GetTitleParamsSchema>;

export const CreateTitleParamsSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export type CreateTitleParams = z.infer<typeof CreateTitleParamsSchema>;

export const DeleteTitleParamsSchema = z.object({
  title_id: z.number().int().positive(),
});

export type DeleteTitleParams = z.infer<typeof DeleteTitleParamsSchema>;

// Update title (REFDATA-14)
export const UpdateTitleParamsSchema = z.object({
  title_id: z.number().int().positive(),
  name: z.string().min(1, "Name is required"),
});

export type UpdateTitleParams = z.infer<typeof UpdateTitleParamsSchema>;

// Search titles (REFDATA-14)
export const SearchTitlesParamsSchema = z.object({
  query: z.string().min(1, "Query is required"),
  limit: z.number().int().positive().default(100),
});

export type SearchTitlesParams = z.infer<typeof SearchTitlesParamsSchema>;

// ===== COUNTRIES (REFDATA-05) =====

export const ListCountriesParamsSchema = z.object({
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

export type ListCountriesParams = z.infer<typeof ListCountriesParamsSchema>;

export const GetCountryParamsSchema = z.object({
  country_id: z.number().int().positive(),
});

export type GetCountryParams = z.infer<typeof GetCountryParamsSchema>;

export const CreateCountryParamsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  name_short: z.string().min(1, "Short name is required"),
  iso3166_alpha2: z.string().length(2, "ISO 3166 alpha-2 code must be exactly 2 characters"),
});

export type CreateCountryParams = z.infer<typeof CreateCountryParamsSchema>;

export const DeleteCountryParamsSchema = z.object({
  country_id: z.number().int().positive(),
});

export type DeleteCountryParams = z.infer<typeof DeleteCountryParamsSchema>;

// ===== LANGUAGES (REFDATA-06) =====

export const ListLanguagesParamsSchema = z.object({
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

export type ListLanguagesParams = z.infer<typeof ListLanguagesParamsSchema>;

export const GetLanguageParamsSchema = z.object({
  language_id: z.number().int().positive(),
});

export type GetLanguageParams = z.infer<typeof GetLanguageParamsSchema>;

export const CreateLanguageParamsSchema = z.object({
  name: z.string().min(1, "Name is required"),
  iso_639_1: z.string().length(2, "ISO 639-1 code must be exactly 2 characters"),
});

export type CreateLanguageParams = z.infer<typeof CreateLanguageParamsSchema>;

// ===== UNITS (REFDATA-07) =====

export const ListUnitsParamsSchema = z.object({
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

export type ListUnitsParams = z.infer<typeof ListUnitsParamsSchema>;

export const GetUnitParamsSchema = z.object({
  unit_id: z.number().int().positive(),
});

export type GetUnitParams = z.infer<typeof GetUnitParamsSchema>;

export const CreateUnitParamsSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export type CreateUnitParams = z.infer<typeof CreateUnitParamsSchema>;

export const DeleteUnitParamsSchema = z.object({
  unit_id: z.number().int().positive(),
});

export type DeleteUnitParams = z.infer<typeof DeleteUnitParamsSchema>;
