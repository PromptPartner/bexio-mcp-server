/**
 * Accounting Zod schemas and types.
 * Domain: Accounting (Accounts, Account Groups, Calendar Years, Business Years, Manual Entries, VAT Periods, Journal)
 *
 * Manual entries use flat MCP parameters - handlers transform to nested Bexio API structure.
 * Bexio validates double-entry rules server-side (debits must equal credits).
 */

import { z } from "zod";

// ===== ACCOUNTS - Chart of Accounts (ACCT-01) =====

export const ListAccountsParamsSchema = z.object({
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

export type ListAccountsParams = z.infer<typeof ListAccountsParamsSchema>;

export const GetAccountParamsSchema = z.object({
  account_id: z.number().int().positive(),
});

export type GetAccountParams = z.infer<typeof GetAccountParamsSchema>;

export const CreateAccountParamsSchema = z.object({
  account_no: z.number().int().positive({ message: "Account number is required and must be positive" }),
  name: z.string().min(1, "Account name is required"),
  account_group_id: z.number().int().positive({ message: "Account group ID is required" }),
  is_active: z.boolean().default(true),
  tax_id: z.number().int().positive().optional(),
});

export type CreateAccountParams = z.infer<typeof CreateAccountParamsSchema>;

export const SearchAccountsParamsSchema = z.object({
  search_criteria: z.array(
    z.object({
      field: z.string(),
      value: z.union([z.string(), z.number(), z.boolean()]),
      criteria: z.string().optional(),
    })
  ).min(1, "At least one search criterion is required"),
});

export type SearchAccountsParams = z.infer<typeof SearchAccountsParamsSchema>;

// ===== ACCOUNT GROUPS (ACCT-02) =====

export const ListAccountGroupsParamsSchema = z.object({
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

export type ListAccountGroupsParams = z.infer<typeof ListAccountGroupsParamsSchema>;

// ===== CALENDAR YEARS (ACCT-03) =====

export const ListCalendarYearsParamsSchema = z.object({
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

export type ListCalendarYearsParams = z.infer<typeof ListCalendarYearsParamsSchema>;

export const GetCalendarYearParamsSchema = z.object({
  year_id: z.number().int().positive(),
});

export type GetCalendarYearParams = z.infer<typeof GetCalendarYearParamsSchema>;

// ===== BUSINESS YEARS (ACCT-04) =====

export const ListBusinessYearsParamsSchema = z.object({
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

export type ListBusinessYearsParams = z.infer<typeof ListBusinessYearsParamsSchema>;

// ===== MANUAL ENTRIES (ACCT-05) =====

export const ListManualEntriesParamsSchema = z.object({
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

export type ListManualEntriesParams = z.infer<typeof ListManualEntriesParamsSchema>;

export const GetManualEntryParamsSchema = z.object({
  entry_id: z.number().int().positive(),
});

export type GetManualEntryParams = z.infer<typeof GetManualEntryParamsSchema>;

/**
 * Schema for creating a manual journal entry.
 * Uses FLAT parameters for MCP interface - handler transforms to nested entries array.
 * Bexio validates that debits equal credits server-side.
 */
export const CreateManualEntryParamsSchema = z.object({
  // Entry type - defaults to manual single entry
  type: z.literal("manual_single_entry").default("manual_single_entry"),

  // Required fields
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  debit_account_id: z.number().int().positive({ message: "Debit account ID is required" }),
  credit_account_id: z.number().int().positive({ message: "Credit account ID is required" }),
  amount: z.number().positive({ message: "Amount must be positive" }),
  description: z.string().min(1, "Description is required"),

  // Optional fields
  reference_nr: z.string().optional(),
  tax_id: z.number().int().positive().optional(),
  tax_account_id: z.number().int().positive().optional(),
  currency_id: z.number().int().positive().optional(),
  currency_factor: z.number().positive().default(1),
});

export type CreateManualEntryParams = z.infer<typeof CreateManualEntryParamsSchema>;

export const UpdateManualEntryParamsSchema = z.object({
  entry_id: z.number().int().positive(),
  entry_data: z.record(z.unknown()),
});

export type UpdateManualEntryParams = z.infer<typeof UpdateManualEntryParamsSchema>;

export const DeleteManualEntryParamsSchema = z.object({
  entry_id: z.number().int().positive(),
});

export type DeleteManualEntryParams = z.infer<typeof DeleteManualEntryParamsSchema>;

// ===== VAT PERIODS (ACCT-06) =====

export const ListVatPeriodsParamsSchema = z.object({
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

export type ListVatPeriodsParams = z.infer<typeof ListVatPeriodsParamsSchema>;

// ===== ACCOUNTING JOURNAL (ACCT-07) =====

export const GetJournalParamsSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

export type GetJournalParams = z.infer<typeof GetJournalParamsSchema>;

// ===== ACCOUNT BALANCES / SALDENLISTE (ACCT-08, computed from journal) =====

export const GetAccountBalancesParamsSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
  account_id: z.number().int().positive().optional(),
});

export type GetAccountBalancesParams = z.infer<typeof GetAccountBalancesParamsSchema>;
