/**
 * Accounting tool definitions.
 * Contains MCP tool metadata for accounting domain.
 * Includes: Accounts, Account Groups, Calendar Years, Business Years, Manual Entries, VAT Periods, Journal
 *
 * 15 tools total covering ACCT-01 through ACCT-07 requirements.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const toolDefinitions: Tool[] = [
  // ===== ACCOUNTS - Chart of Accounts (ACCT-01) =====
  {
    name: "list_accounts",
    description: "List chart of accounts with pagination. Returns all accounts in the chart of accounts.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          description: "Maximum number of results to return (default: 100)",
          default: 100,
        },
        offset: {
          type: "integer",
          description: "Number of results to skip (default: 0)",
          default: 0,
        },
      },
    },
  },
  {
    name: "get_account",
    description: "Get a specific account by ID from the chart of accounts",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        account_id: {
          type: "integer",
          description: "The ID of the account to retrieve",
        },
      },
      required: ["account_id"],
    },
  },
  {
    name: "create_account",
    description: "Create a new account in the chart of accounts",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        account_no: {
          type: "integer",
          description: "The account number (must be unique and positive)",
        },
        name: {
          type: "string",
          description: "The name of the account",
        },
        account_group_id: {
          type: "integer",
          description: "The ID of the account group this account belongs to",
        },
        is_active: {
          type: "boolean",
          description: "Whether the account is active (default: true)",
          default: true,
        },
        tax_id: {
          type: "integer",
          description: "Optional tax ID to associate with this account",
        },
      },
      required: ["account_no", "name", "account_group_id"],
    },
  },
  {
    name: "search_accounts",
    description: "Search accounts by criteria. Use field/value/criteria pattern for flexible searching.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        search_criteria: {
          type: "array",
          description: "Array of search criteria objects",
          items: {
            type: "object",
            properties: {
              field: {
                type: "string",
                description: "Field to search (e.g., 'name', 'account_no')",
              },
              value: {
                type: ["string", "number", "boolean"],
                description: "Value to search for",
              },
              criteria: {
                type: "string",
                description: "Search operator (e.g., '=', 'like', '>')",
              },
            },
            required: ["field", "value"],
          },
        },
      },
      required: ["search_criteria"],
    },
  },

  // ===== ACCOUNT GROUPS (ACCT-02) =====
  {
    name: "list_account_groups",
    description: "List account groups (read-only hierarchy). Account groups organize the chart of accounts into categories.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          description: "Maximum number of results to return (default: 100)",
          default: 100,
        },
        offset: {
          type: "integer",
          description: "Number of results to skip (default: 0)",
          default: 0,
        },
      },
    },
  },

  // ===== CALENDAR YEARS (ACCT-03) =====
  {
    name: "list_calendar_years",
    description: "List calendar years defined in the system",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          description: "Maximum number of results to return (default: 100)",
          default: 100,
        },
        offset: {
          type: "integer",
          description: "Number of results to skip (default: 0)",
          default: 0,
        },
      },
    },
  },
  {
    name: "get_calendar_year",
    description: "Get a specific calendar year by ID",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        year_id: {
          type: "integer",
          description: "The ID of the calendar year to retrieve",
        },
      },
      required: ["year_id"],
    },
  },

  // ===== BUSINESS YEARS (ACCT-04) =====
  {
    name: "list_business_years",
    description: "List business/fiscal years (read-only). Business years define fiscal periods for accounting.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          description: "Maximum number of results to return (default: 100)",
          default: 100,
        },
        offset: {
          type: "integer",
          description: "Number of results to skip (default: 0)",
          default: 0,
        },
      },
    },
  },

  // ===== MANUAL ENTRIES (ACCT-05) =====
  {
    name: "list_manual_entries",
    description: "List manual journal entries",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          description: "Maximum number of results to return (default: 100)",
          default: 100,
        },
        offset: {
          type: "integer",
          description: "Number of results to skip (default: 0)",
          default: 0,
        },
      },
    },
  },
  {
    name: "get_manual_entry",
    description: "Get a specific manual entry by ID",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        entry_id: {
          type: "integer",
          description: "The ID of the manual entry to retrieve",
        },
      },
      required: ["entry_id"],
    },
  },
  {
    name: "create_manual_entry",
    description: "Create a manual journal entry (double-entry bookkeeping). Provide flat params; the handler transforms to nested entries array internally. Bexio validates that debits equal credits.",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Entry date in YYYY-MM-DD format",
        },
        debit_account_id: {
          type: "integer",
          description: "The account ID to debit",
        },
        credit_account_id: {
          type: "integer",
          description: "The account ID to credit",
        },
        amount: {
          type: "number",
          description: "The amount for the entry (must be positive)",
        },
        description: {
          type: "string",
          description: "Description of the journal entry",
        },
        reference_nr: {
          type: "string",
          description: "Optional reference number for the entry",
        },
        tax_id: {
          type: "integer",
          description: "Optional tax ID to apply",
        },
        tax_account_id: {
          type: "integer",
          description: "Optional tax account ID",
        },
        currency_id: {
          type: "integer",
          description: "Optional currency ID (defaults to company currency)",
        },
        currency_factor: {
          type: "number",
          description: "Optional currency exchange factor (default: 1)",
          default: 1,
        },
      },
      required: ["date", "debit_account_id", "credit_account_id", "amount", "description"],
    },
  },
  {
    name: "update_manual_entry",
    description: "Update a manual entry",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        entry_id: {
          type: "integer",
          description: "The ID of the manual entry to update",
        },
        entry_data: {
          type: "object",
          description: "The data to update on the manual entry",
        },
      },
      required: ["entry_id", "entry_data"],
    },
  },
  {
    name: "delete_manual_entry",
    description: "Delete a manual entry",
    annotations: { destructiveHint: true },
    inputSchema: {
      type: "object",
      properties: {
        entry_id: {
          type: "integer",
          description: "The ID of the manual entry to delete",
        },
      },
      required: ["entry_id"],
    },
  },

  // ===== VAT PERIODS (ACCT-06) =====
  {
    name: "list_vat_periods",
    description: "List VAT periods (read-only). VAT periods define reporting periods for value-added tax.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          description: "Maximum number of results to return (default: 100)",
          default: 100,
        },
        offset: {
          type: "integer",
          description: "Number of results to skip (default: 0)",
          default: 0,
        },
      },
    },
  },

  // ===== ACCOUNTING JOURNAL (ACCT-07) =====
  {
    name: "get_journal",
    description: "Query the accounting journal with optional date range. Returns journal entries for the specified period.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        start_date: {
          type: "string",
          description: "Start date filter in YYYY-MM-DD format",
        },
        end_date: {
          type: "string",
          description: "End date filter in YYYY-MM-DD format",
        },
        limit: {
          type: "integer",
          description: "Maximum number of results to return (default: 100)",
          default: 100,
        },
        offset: {
          type: "integer",
          description: "Number of results to skip (default: 0)",
          default: 0,
        },
      },
    },
  },

  // ===== ACCOUNT BALANCES / SALDENLISTE (ACCT-08, computed from journal) =====
  {
    name: "get_account_balances",
    description:
      "Get account balances (Saldenliste) computed from the accounting journal. Bexio has no native balance endpoint, so balances are derived: balance = sum(debits) - sum(credits) per account over the date range. Defaults to the current business year, which includes opening/carry-forward entries and therefore reflects the current balance. Returns each account with account_no, name, debit/credit totals and balance.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        start_date: {
          type: "string",
          description: "Range start in YYYY-MM-DD. Defaults to the start of the current business year.",
        },
        end_date: {
          type: "string",
          description: "Range end in YYYY-MM-DD. Defaults to the end of the current business year.",
        },
        account_id: {
          type: "integer",
          description: "Optional: return the balance for a single account ID only.",
        },
      },
    },
  },
];
