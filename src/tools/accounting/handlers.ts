/**
 * Accounting tool handlers.
 * Implements the logic for each accounting tool.
 *
 * IMPORTANT: create_manual_entry transforms flat MCP params to nested Bexio API structure.
 * Bexio validates double-entry rules server-side (debits must equal credits).
 */

import { BexioClient } from "../../bexio-client.js";
import { McpError } from "../../shared/errors.js";
import {
  // Accounts
  ListAccountsParamsSchema,
  GetAccountParamsSchema,
  CreateAccountParamsSchema,
  SearchAccountsParamsSchema,
  // Account Groups
  ListAccountGroupsParamsSchema,
  // Calendar Years
  ListCalendarYearsParamsSchema,
  GetCalendarYearParamsSchema,
  // Business Years
  ListBusinessYearsParamsSchema,
  // Manual Entries
  ListManualEntriesParamsSchema,
  GetManualEntryParamsSchema,
  CreateManualEntryParamsSchema,
  UpdateManualEntryParamsSchema,
  DeleteManualEntryParamsSchema,
  // VAT Periods
  ListVatPeriodsParamsSchema,
  // Journal
  GetJournalParamsSchema,
  // Account Balances
  GetAccountBalancesParamsSchema,
} from "../../types/index.js";

export type HandlerFn = (
  client: BexioClient,
  args: unknown
) => Promise<unknown>;

export const handlers: Record<string, HandlerFn> = {
  // ===== ACCOUNTS - Chart of Accounts (ACCT-01) =====
  list_accounts: async (client, args) => {
    const params = ListAccountsParamsSchema.parse(args);
    return client.listAccounts(params);
  },

  get_account: async (client, args) => {
    const { account_id } = GetAccountParamsSchema.parse(args);
    const account = await client.getAccount(account_id);
    if (!account) {
      throw McpError.notFound("Account", account_id);
    }
    return account;
  },

  create_account: async (client, args) => {
    const params = CreateAccountParamsSchema.parse(args);
    return client.createAccount(params);
  },

  search_accounts: async (client, args) => {
    const { search_criteria } = SearchAccountsParamsSchema.parse(args);
    return client.searchAccounts(search_criteria);
  },

  // ===== ACCOUNT GROUPS (ACCT-02) =====
  list_account_groups: async (client, args) => {
    const params = ListAccountGroupsParamsSchema.parse(args);
    return client.listAccountGroups(params);
  },

  // ===== CALENDAR YEARS (ACCT-03) =====
  list_calendar_years: async (client, args) => {
    const params = ListCalendarYearsParamsSchema.parse(args);
    return client.listCalendarYears(params);
  },

  get_calendar_year: async (client, args) => {
    const { year_id } = GetCalendarYearParamsSchema.parse(args);
    const year = await client.getCalendarYear(year_id);
    if (!year) {
      throw McpError.notFound("Calendar Year", year_id);
    }
    return year;
  },

  // ===== BUSINESS YEARS (ACCT-04) =====
  list_business_years: async (client, args) => {
    const params = ListBusinessYearsParamsSchema.parse(args);
    return client.listBusinessYears(params);
  },

  // ===== MANUAL ENTRIES (ACCT-05) =====
  list_manual_entries: async (client, args) => {
    const params = ListManualEntriesParamsSchema.parse(args);
    return client.listManualEntries(params);
  },

  get_manual_entry: async (client, args) => {
    const { entry_id } = GetManualEntryParamsSchema.parse(args);
    const entry = await client.getManualEntry(entry_id);
    if (!entry) {
      throw McpError.notFound("Manual Entry", entry_id);
    }
    return entry;
  },

  create_manual_entry: async (client, args) => {
    const params = CreateManualEntryParamsSchema.parse(args);

    // Transform flat MCP params to Bexio API nested structure
    // Bexio expects an entries array even for single-entry bookings
    const entryData = {
      type: params.type || "manual_single_entry",
      date: params.date,
      reference_nr: params.reference_nr,
      entries: [{
        debit_account_id: params.debit_account_id,
        credit_account_id: params.credit_account_id,
        tax_id: params.tax_id,
        tax_account_id: params.tax_account_id,
        description: params.description,
        amount: params.amount,
        currency_id: params.currency_id,
        currency_factor: params.currency_factor,
      }],
    };

    return client.createManualEntry(entryData);
  },

  update_manual_entry: async (client, args) => {
    const { entry_id, entry_data } = UpdateManualEntryParamsSchema.parse(args);
    return client.updateManualEntry(entry_id, entry_data);
  },

  delete_manual_entry: async (client, args) => {
    const { entry_id } = DeleteManualEntryParamsSchema.parse(args);
    return client.deleteManualEntry(entry_id);
  },

  // ===== VAT PERIODS (ACCT-06) =====
  list_vat_periods: async (client, args) => {
    const params = ListVatPeriodsParamsSchema.parse(args);
    return client.listVatPeriods(params);
  },

  // ===== ACCOUNTING JOURNAL (ACCT-07) =====
  get_journal: async (client, args) => {
    const params = GetJournalParamsSchema.parse(args);
    return client.getJournal(params);
  },

  // ===== ACCOUNT BALANCES / SALDENLISTE (ACCT-08) =====
  get_account_balances: async (client, args) => {
    const params = GetAccountBalancesParamsSchema.parse(args);
    return client.getAccountBalances(params);
  },
};
