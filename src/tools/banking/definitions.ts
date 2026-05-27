/**
 * Banking tool definitions.
 * Contains MCP tool metadata for banking domain.
 *
 * Swiss Standards:
 * - IBAN payments: Swiss ISO 20022 payment standards
 * - QR payments: SIX Group QR-bill specification v2.3
 * - Addresses: Structured format only (type S) - required from Nov 2025
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const toolDefinitions: Tool[] = [
  // ===== BANK ACCOUNTS (Read-Only) =====
  {
    name: "list_bank_accounts",
    description:
      "List all configured bank accounts in Bexio. Returns account details including IBAN, bank name, and currency. Use this to get valid bank_account_id values before creating payments.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          description: "Maximum number of accounts to return (default: 100)",
          default: 100,
        },
        offset: {
          type: "integer",
          description: "Number of accounts to skip (default: 0)",
          default: 0,
        },
      },
    },
  },
  {
    name: "get_bank_account",
    description: "Get details of a specific bank account by ID",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        account_id: {
          type: "integer",
          description: "The ID of the bank account to retrieve",
        },
      },
      required: ["account_id"],
    },
  },

  // ===== CURRENCIES =====
  {
    name: "list_currencies",
    description:
      "List all currencies configured in Bexio. Returns currency codes (CHF, EUR, USD, etc.) with their rounding factors for invoicing.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          description: "Maximum number of currencies to return (default: 100)",
          default: 100,
        },
        offset: {
          type: "integer",
          description: "Number of currencies to skip (default: 0)",
          default: 0,
        },
      },
    },
  },
  {
    name: "get_currency",
    description: "Get details of a specific currency by ID",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        currency_id: {
          type: "integer",
          description: "The ID of the currency to retrieve",
        },
      },
      required: ["currency_id"],
    },
  },
  {
    name: "create_currency",
    description:
      "Create a new currency in Bexio. Swiss default: round_factor 0.05 (5 rappen). Common currencies: CHF, EUR, USD, GBP.",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Currency code (e.g., 'CHF', 'EUR', 'USD'). Max 10 characters.",
        },
        round_factor: {
          type: "number",
          description: "Rounding factor for amounts (default: 0.05 for Swiss 5 rappen)",
          default: 0.05,
        },
      },
      required: ["name"],
    },
  },
  {
    name: "update_currency",
    description: "Update an existing currency's settings",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        currency_id: {
          type: "integer",
          description: "The ID of the currency to update",
        },
        currency_data: {
          type: "object",
          description: "Currency fields to update (e.g., round_factor)",
        },
      },
      required: ["currency_id", "currency_data"],
    },
  },
  {
    name: "delete_currency",
    description: "Delete a currency by ID. Cannot delete currencies in use by documents.",
    annotations: { destructiveHint: true },
    inputSchema: {
      type: "object",
      properties: {
        currency_id: {
          type: "integer",
          description: "The ID of the currency to delete",
        },
      },
      required: ["currency_id"],
    },
  },

  // ===== IBAN PAYMENTS (Swiss ISO 20022) =====
  {
    name: "create_iban_payment",
    description:
      "Create an IBAN payment (Swiss ISO 20022 standard). First use list_bank_accounts to get a valid bank_account_id. Only CHF and EUR currencies are supported. Recipient address must use structured format (street, house_number, zip, city, country_code).",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        bank_account_id: {
          type: "integer",
          description: "ID of the bank account to pay from (use list_bank_accounts to find)",
        },
        iban: {
          type: "string",
          description: "Recipient IBAN (15-34 characters)",
        },
        currency: {
          type: "string",
          enum: ["CHF", "EUR"],
          description: "Payment currency (CHF or EUR only)",
        },
        amount: {
          type: "number",
          description: "Payment amount (positive number)",
        },
        recipient_name: {
          type: "string",
          description: "Recipient name (max 70 characters)",
        },
        recipient_street: {
          type: "string",
          description: "Street name (max 70 characters, optional)",
        },
        recipient_house_number: {
          type: "string",
          description: "House/building number (max 16 characters, optional)",
        },
        recipient_zip: {
          type: "string",
          description: "Postal/ZIP code (max 10 characters)",
        },
        recipient_city: {
          type: "string",
          description: "City name (max 35 characters)",
        },
        recipient_country_code: {
          type: "string",
          description: "ISO 3166-1 alpha-2 country code (default: CH)",
          default: "CH",
        },
        execution_date: {
          type: "string",
          description: "Payment execution date (YYYY-MM-DD format)",
        },
        message: {
          type: "string",
          description: "Payment message/reference (max 140 characters, optional)",
        },
        is_salary_payment: {
          type: "boolean",
          description: "Mark as salary payment (default: false)",
          default: false,
        },
        allowance_type: {
          type: "string",
          enum: ["no_fee", "our", "ben", "sha"],
          description: "Fee allocation: no_fee, our (sender pays), ben (beneficiary pays), sha (shared). Default: no_fee",
          default: "no_fee",
        },
      },
      required: [
        "bank_account_id",
        "iban",
        "currency",
        "amount",
        "recipient_name",
        "recipient_zip",
        "recipient_city",
        "execution_date",
      ],
    },
  },
  {
    name: "get_iban_payment",
    description: "Get details of an IBAN payment by ID",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        bank_account_id: {
          type: "integer",
          description: "ID of the bank account the payment belongs to (use list_bank_accounts to find)",
        },
        payment_id: {
          type: "integer",
          description: "The ID of the IBAN payment to retrieve",
        },
      },
      required: ["bank_account_id", "payment_id"],
    },
  },
  {
    name: "update_iban_payment",
    description: "Update a pending IBAN payment. Only pending payments can be modified.",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        bank_account_id: {
          type: "integer",
          description: "ID of the bank account the payment belongs to (use list_bank_accounts to find)",
        },
        payment_id: {
          type: "integer",
          description: "The ID of the IBAN payment to update",
        },
        payment_data: {
          type: "object",
          description: "Payment fields to update",
        },
      },
      required: ["bank_account_id", "payment_id", "payment_data"],
    },
  },

  // ===== QR PAYMENTS (Swiss QR-invoice standard) =====
  {
    name: "create_qr_payment",
    description:
      "Create a QR payment (Swiss QR-invoice standard per SIX Group spec v2.3). First use list_bank_accounts to get a valid bank_account_id. Only CHF and EUR currencies are supported. QR reference must be exactly 27 digits if provided. Recipient address must use structured format.",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        bank_account_id: {
          type: "integer",
          description: "ID of the bank account to pay from (use list_bank_accounts to find)",
        },
        iban: {
          type: "string",
          description: "Recipient QR-IBAN (15-34 characters)",
        },
        currency: {
          type: "string",
          enum: ["CHF", "EUR"],
          description: "Payment currency (CHF or EUR only)",
        },
        amount: {
          type: "number",
          description: "Payment amount (positive, max 999999999.99)",
        },
        recipient_name: {
          type: "string",
          description: "Recipient name (max 70 characters)",
        },
        recipient_street: {
          type: "string",
          description: "Street name (max 70 characters, optional)",
        },
        recipient_house_number: {
          type: "string",
          description: "House/building number (max 16 characters, optional)",
        },
        recipient_zip: {
          type: "string",
          description: "Postal/ZIP code (max 10 characters)",
        },
        recipient_city: {
          type: "string",
          description: "City name (max 35 characters)",
        },
        recipient_country_code: {
          type: "string",
          description: "ISO 3166-1 alpha-2 country code (default: CH)",
          default: "CH",
        },
        execution_date: {
          type: "string",
          description: "Payment execution date (YYYY-MM-DD format)",
        },
        qr_reference_nr: {
          type: "string",
          description: "QR reference number (exactly 27 digits, optional)",
        },
        additional_information: {
          type: "string",
          description: "Additional payment information (max 140 characters, optional)",
        },
      },
      required: [
        "bank_account_id",
        "iban",
        "currency",
        "amount",
        "recipient_name",
        "recipient_zip",
        "recipient_city",
        "execution_date",
      ],
    },
  },
  {
    name: "get_qr_payment",
    description: "Get details of a QR payment by ID",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        bank_account_id: {
          type: "integer",
          description: "ID of the bank account the payment belongs to (use list_bank_accounts to find)",
        },
        payment_id: {
          type: "integer",
          description: "The ID of the QR payment to retrieve",
        },
      },
      required: ["bank_account_id", "payment_id"],
    },
  },
  {
    name: "update_qr_payment",
    description: "Update a pending QR payment. Only pending payments can be modified.",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        bank_account_id: {
          type: "integer",
          description: "ID of the bank account the payment belongs to (use list_bank_accounts to find)",
        },
        payment_id: {
          type: "integer",
          description: "The ID of the QR payment to update",
        },
        payment_data: {
          type: "object",
          description: "Payment fields to update",
        },
      },
      required: ["bank_account_id", "payment_id", "payment_data"],
    },
  },
];
