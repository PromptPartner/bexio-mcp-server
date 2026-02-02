/**
 * Banking-related Zod schemas and types.
 * Domain: Banking (Bank Accounts, Currencies, IBAN Payments, QR Payments)
 *
 * Swiss Standards:
 * - IBAN payments: Swiss ISO 20022 payment standards
 * - QR payments: SIX Group QR-bill specification v2.3
 * - Addresses: Structured format only (type S) - required from Nov 2025
 */

import { z } from "zod";

// ===== BANK ACCOUNTS (BANK-01) - Read Only =====

export const ListBankAccountsParamsSchema = z.object({
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

export type ListBankAccountsParams = z.infer<typeof ListBankAccountsParamsSchema>;

export const GetBankAccountParamsSchema = z.object({
  account_id: z.number().int().positive(),
});

export type GetBankAccountParams = z.infer<typeof GetBankAccountParamsSchema>;

// ===== CURRENCIES (BANK-02) - Full CRUD =====

export const ListCurrenciesParamsSchema = z.object({
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

export type ListCurrenciesParams = z.infer<typeof ListCurrenciesParamsSchema>;

export const GetCurrencyParamsSchema = z.object({
  currency_id: z.number().int().positive(),
});

export type GetCurrencyParams = z.infer<typeof GetCurrencyParamsSchema>;

export const CreateCurrencyParamsSchema = z.object({
  name: z.string().min(1).max(10),
  round_factor: z.number().positive().default(0.05), // Swiss 5 rappen default
});

export type CreateCurrencyParams = z.infer<typeof CreateCurrencyParamsSchema>;

export const UpdateCurrencyParamsSchema = z.object({
  currency_id: z.number().int().positive(),
  currency_data: z.record(z.unknown()),
});

export type UpdateCurrencyParams = z.infer<typeof UpdateCurrencyParamsSchema>;

export const DeleteCurrencyParamsSchema = z.object({
  currency_id: z.number().int().positive(),
});

export type DeleteCurrencyParams = z.infer<typeof DeleteCurrencyParamsSchema>;

// ===== IBAN PAYMENTS (BANK-03) - Swiss ISO 20022 =====

// Flat params schema for MCP tool interface
// Structured recipient address (required from Nov 2025)
export const CreateIbanPaymentParamsSchema = z.object({
  bank_account_id: z.number().int().positive(),
  iban: z.string().min(15).max(34),
  currency: z.enum(["CHF", "EUR"]),
  amount: z.number().positive(),
  recipient_name: z.string().max(70),
  recipient_street: z.string().max(70).optional(),
  recipient_house_number: z.string().max(16).optional(),
  recipient_zip: z.string().max(10),
  recipient_city: z.string().max(35),
  recipient_country_code: z.string().length(2).default("CH"),
  execution_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
  message: z.string().max(140).optional(),
  is_salary_payment: z.boolean().default(false),
  allowance_type: z.enum(["no_fee", "our", "ben", "sha"]).default("no_fee"),
});

export type CreateIbanPaymentParams = z.infer<typeof CreateIbanPaymentParamsSchema>;

export const GetIbanPaymentParamsSchema = z.object({
  payment_id: z.number().int().positive(),
});

export type GetIbanPaymentParams = z.infer<typeof GetIbanPaymentParamsSchema>;

export const UpdateIbanPaymentParamsSchema = z.object({
  payment_id: z.number().int().positive(),
  payment_data: z.record(z.unknown()),
});

export type UpdateIbanPaymentParams = z.infer<typeof UpdateIbanPaymentParamsSchema>;

// ===== QR PAYMENTS (BANK-04) - Swiss QR-invoice standard =====

export const CreateQrPaymentParamsSchema = z.object({
  bank_account_id: z.number().int().positive(),
  iban: z.string().min(15).max(34),
  currency: z.enum(["CHF", "EUR"]),
  amount: z.number().positive().max(999999999.99),
  recipient_name: z.string().max(70),
  recipient_street: z.string().max(70).optional(),
  recipient_house_number: z.string().max(16).optional(),
  recipient_zip: z.string().max(10),
  recipient_city: z.string().max(35),
  recipient_country_code: z.string().length(2).default("CH"),
  execution_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD format"),
  qr_reference_nr: z.string().length(27).regex(/^\d+$/, "QR reference must be 27 digits").optional(),
  additional_information: z.string().max(140).optional(),
});

export type CreateQrPaymentParams = z.infer<typeof CreateQrPaymentParamsSchema>;

export const GetQrPaymentParamsSchema = z.object({
  payment_id: z.number().int().positive(),
});

export type GetQrPaymentParams = z.infer<typeof GetQrPaymentParamsSchema>;

export const UpdateQrPaymentParamsSchema = z.object({
  payment_id: z.number().int().positive(),
  payment_data: z.record(z.unknown()),
});

export type UpdateQrPaymentParams = z.infer<typeof UpdateQrPaymentParamsSchema>;
