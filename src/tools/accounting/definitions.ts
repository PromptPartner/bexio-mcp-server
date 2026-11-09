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
          description: "Currency ID (default: the company's base currency). bexio rejects postings without a currency.",
        },
        currency_factor: {
          type: "number",
          description: "Currency exchange factor (default: 1)",
          default: 1,
        },
      },
      required: ["date", "debit_account_id", "credit_account_id", "amount", "description"],
    },
  },
  {
    name: "create_manual_group_entry",
    description:
      "Create a manual GROUP entry (Sammelbuchung): one document holding many postings, e.g. a whole payroll run booked as a single voucher. Each line keeps its own debit account, credit account, amount and description; date and currency are inherited from the document unless the line overrides them. Prefer this over repeated create_manual_entry calls: it is one API round-trip instead of one per line, and the result is a single voucher that can be corrected or deleted as a unit. Bexio validates that debits equal credits.",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        date: {
          type: "string",
          description: "Document date in YYYY-MM-DD format. Used for any line that omits its own date.",
        },
        entries: {
          type: "array",
          description: "The postings of this voucher. At least one.",
          items: {
            type: "object",
            properties: {
              debit_account_id: { type: "integer", description: "The account ID to debit" },
              credit_account_id: { type: "integer", description: "The account ID to credit" },
              amount: { type: "number", description: "The amount for this line (must be positive)" },
              description: { type: "string", description: "Description of this posting" },
              date: { type: "string", description: "Optional line date in YYYY-MM-DD; defaults to the document date" },
              tax_id: { type: "integer", description: "Optional tax ID to apply" },
              tax_account_id: { type: "integer", description: "Optional tax account ID" },
              currency_id: { type: "integer", description: "Optional currency ID; defaults to the document currency" },
              currency_factor: { type: "number", description: "Optional currency exchange factor; defaults to the document factor" },
            },
            required: ["debit_account_id", "credit_account_id", "amount", "description"],
          },
        },
        reference_nr: {
          type: "string",
          description: "Optional reference number for the voucher (useful as an idempotency key when re-importing)",
        },
        currency_id: {
          type: "integer",
          description: "Currency ID for all lines that do not set their own (default: the company's base currency)",
        },
        currency_factor: {
          type: "number",
          description: "Currency exchange factor for all lines that do not set their own (default: 1)",
          default: 1,
        },
      },
      required: ["date", "entries"],
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

  {
    name: "get_next_manual_entry_ref_nr",
    description: "Get the reference number bexio proposes for the next manual entry ({ next_ref_nr }).",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {} },
  },

  // ===== MANUAL ENTRY FILES (receipts on manual entries) =====
  {
    name: "list_manual_entry_files",
    description:
      "List the files (receipts) attached to a manual entry. For single and group entries bexio keeps files per posting line: pass line_id. For compound entries omit line_id.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        manual_entry_id: { type: "integer", description: "ID of the manual entry (the id from list_manual_entries / get_manual_entry)" },
        line_id: { type: "integer", description: "ID of the posting line (entries[].id from get_manual_entry). Required for single and group entries, where bexio keeps files per line; omit it only for compound entries (type manual_compound_entry), whose files hang on the entry itself." },
        limit: { type: "integer", description: "Maximum number of results (default: 100)", default: 100 },
        offset: { type: "integer", description: "Number of results to skip (default: 0)", default: 0 },
      },
      required: ["manual_entry_id"],
    },
  },
  {
    name: "get_manual_entry_file",
    description:
      "Get the metadata of one file attached to a manual entry. The content is not returned; use download_file with the same file_id.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        manual_entry_id: { type: "integer", description: "ID of the manual entry (the id from list_manual_entries / get_manual_entry)" },
        line_id: { type: "integer", description: "ID of the posting line (entries[].id from get_manual_entry). Required for single and group entries, where bexio keeps files per line; omit it only for compound entries (type manual_compound_entry), whose files hang on the entry itself." },
        file_id: { type: "integer", description: "The ID of the file" },
      },
      required: ["manual_entry_id", "file_id"],
    },
  },
  {
    name: "attach_file_to_manual_entry",
    description:
      "Upload a receipt and attach it to a manual entry (the 'Beleg' of a booking). Provide EITHER file_path (preferred: the server reads the file itself) OR content_base64 + name + content_type. bexio accepts PDF, PNG, JPG/JPEG, GIF, DOC(X), XLS(X) and PPT(X) up to 12 MB. file_path works for any local path in stdio mode; in HTTP mode only inside BEXIO_FILE_DIR.",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        manual_entry_id: { type: "integer", description: "ID of the manual entry (the id from list_manual_entries / get_manual_entry)" },
        line_id: { type: "integer", description: "ID of the posting line (entries[].id from get_manual_entry). Required for single and group entries, where bexio keeps files per line; omit it only for compound entries (type manual_compound_entry), whose files hang on the entry itself." },
        file_path: { type: "string", description: "Path of a local file for the server to read and upload. Mutually exclusive with content_base64." },
        content_base64: { type: "string", description: "The file content encoded as base64. Mutually exclusive with file_path; requires name and content_type." },
        name: { type: "string", description: "The filename including extension. Defaults to the file_path's filename." },
        content_type: { type: "string", description: "The MIME type (e.g., 'application/pdf'). With file_path it defaults from the file extension." },
      },
      required: ["manual_entry_id"],
    },
  },
  {
    name: "detach_file_from_manual_entry",
    description:
      "Remove the link between a file and a manual entry. The file itself stays in bexio (see list_files); only the attachment is removed.",
    annotations: { destructiveHint: true },
    inputSchema: {
      type: "object",
      properties: {
        manual_entry_id: { type: "integer", description: "ID of the manual entry (the id from list_manual_entries / get_manual_entry)" },
        line_id: { type: "integer", description: "ID of the posting line (entries[].id from get_manual_entry). Required for single and group entries, where bexio keeps files per line; omit it only for compound entries (type manual_compound_entry), whose files hang on the entry itself." },
        file_id: { type: "integer", description: "The ID of the attached file" },
      },
      required: ["manual_entry_id", "file_id"],
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
    description:
      "Query the accounting journal for a date range, optionally narrowed to one account. The range is filtered server-side by bexio and re-checked locally, so a period is never silently wrong; the response reports total_matched, scanned_rows and server_side_filter. Without a date range this returns a raw journal page. limit/offset apply to the filtered result.",
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
        account_uuid: {
          type: "string",
          description: "Optional: restrict the journal to a single account, by the account's uuid (from list_accounts).",
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
      "Get account balances (Saldenliste) computed from the accounting journal. Bexio has no native balance endpoint, so balances are derived: balance = sum(debits) - sum(credits) per account over the date range. The range is filtered server-side and re-checked locally; the response reports scanned_rows, matched_rows, server_side_filter and truncated, so an incomplete scan is visible rather than silently wrong. Passing account_id also narrows the journal query itself to that account. Defaults to the current business year, which includes opening/carry-forward entries and therefore reflects the current balance. Returns each account with account_no, name, debit/credit totals and balance.",
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
