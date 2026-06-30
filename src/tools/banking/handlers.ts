/**
 * Banking tool handlers.
 * Implements the logic for each banking tool.
 *
 * Payment handlers transform flat MCP params to nested Bexio API structure.
 */

import { BexioClient } from "../../bexio-client.js";
import { McpError } from "../../shared/errors.js";
import {
  ListBankAccountsParamsSchema,
  GetBankAccountParamsSchema,
  ListCurrenciesParamsSchema,
  GetCurrencyParamsSchema,
  CreateCurrencyParamsSchema,
  UpdateCurrencyParamsSchema,
  DeleteCurrencyParamsSchema,
  GetCurrencyExchangeRatesParamsSchema,
  ListCurrencyCodesParamsSchema,
  CreateIbanPaymentParamsSchema,
  GetIbanPaymentParamsSchema,
  UpdateIbanPaymentParamsSchema,
  CreateQrPaymentParamsSchema,
  GetQrPaymentParamsSchema,
  UpdateQrPaymentParamsSchema,
} from "../../types/index.js";

export type HandlerFn = (
  client: BexioClient,
  args: unknown
) => Promise<unknown>;

// #12: standalone IBAN/QR payments are NOT linked to a bill and cannot be linked
// afterward. Attach a steering hint to the success response so the model
// self-corrects toward create_outgoing_payment when a bill was actually meant.
const STANDALONE_PAYMENT_HINT =
  "This is a STANDALONE bank payment and is NOT linked to any supplier bill; it cannot be attached to a bill afterward. If you meant to pay a supplier bill, use create_outgoing_payment with a bill_id instead (works for IBAN and QR) — that records the payment against the bill and marks it paid.";

function withStandaloneHint(result: unknown): unknown {
  if (result && typeof result === "object" && !Array.isArray(result)) {
    return { ...(result as Record<string, unknown>), _hint: STANDALONE_PAYMENT_HINT };
  }
  return result;
}

export const handlers: Record<string, HandlerFn> = {
  // ===== BANK ACCOUNTS (Read-Only) =====
  list_bank_accounts: async (client, args) => {
    const params = ListBankAccountsParamsSchema.parse(args);
    return client.listBankAccounts(params);
  },

  get_bank_account: async (client, args) => {
    const { account_id } = GetBankAccountParamsSchema.parse(args);
    const account = await client.getBankAccount(account_id);
    if (!account) {
      throw McpError.notFound("Bank account", account_id);
    }
    return account;
  },

  // ===== CURRENCIES =====
  list_currencies: async (client, args) => {
    const params = ListCurrenciesParamsSchema.parse(args);
    return client.listCurrencies(params);
  },

  get_currency: async (client, args) => {
    const { currency_id } = GetCurrencyParamsSchema.parse(args);
    const currency = await client.getCurrency(currency_id);
    if (!currency) {
      throw McpError.notFound("Currency", currency_id);
    }
    return currency;
  },

  create_currency: async (client, args) => {
    const params = CreateCurrencyParamsSchema.parse(args);
    return client.createCurrency(params);
  },

  update_currency: async (client, args) => {
    const { currency_id, currency_data } = UpdateCurrencyParamsSchema.parse(args);
    return client.updateCurrency(currency_id, currency_data);
  },

  delete_currency: async (client, args) => {
    const { currency_id } = DeleteCurrencyParamsSchema.parse(args);
    return client.deleteCurrency(currency_id);
  },

  get_currency_exchange_rates: async (client, args) => {
    const { currency_id, date } = GetCurrencyExchangeRatesParamsSchema.parse(args);
    return client.getCurrencyExchangeRates(currency_id, date ? { date } : {});
  },

  list_currency_codes: async (client, args) => {
    ListCurrencyCodesParamsSchema.parse(args);
    return client.listCurrencyCodes();
  },

  // ===== IBAN PAYMENTS (Swiss ISO 20022) =====
  create_iban_payment: async (client, args) => {
    const params = CreateIbanPaymentParamsSchema.parse(args);

    // Transform flat params to Bexio API nested structure
    const paymentData = {
      bank_account_id: params.bank_account_id,
      iban: params.iban,
      instructed_amount: {
        currency: params.currency,
        amount: params.amount,
      },
      recipient: {
        name: params.recipient_name,
        street: params.recipient_street,
        house_number: params.recipient_house_number,
        zip: params.recipient_zip,
        city: params.recipient_city,
        country_code: params.recipient_country_code,
      },
      execution_date: params.execution_date,
      message: params.message,
      is_salary_payment: params.is_salary_payment,
      allowance_type: params.allowance_type,
    };

    return withStandaloneHint(await client.createIbanPayment(paymentData));
  },

  get_iban_payment: async (client, args) => {
    const { bank_account_id, payment_id } = GetIbanPaymentParamsSchema.parse(args);
    const payment = await client.getIbanPayment(bank_account_id, payment_id);
    if (!payment) {
      throw McpError.notFound("IBAN payment", payment_id);
    }
    return payment;
  },

  update_iban_payment: async (client, args) => {
    const { bank_account_id, payment_id, payment_data } = UpdateIbanPaymentParamsSchema.parse(args);
    return client.updateIbanPayment(bank_account_id, payment_id, payment_data);
  },

  // ===== QR PAYMENTS (Swiss QR-invoice standard) =====
  create_qr_payment: async (client, args) => {
    const params = CreateQrPaymentParamsSchema.parse(args);

    // Transform flat params to Bexio API nested structure
    const paymentData = {
      bank_account_id: params.bank_account_id,
      iban: params.iban,
      instructed_amount: {
        currency: params.currency,
        amount: params.amount,
      },
      recipient: {
        name: params.recipient_name,
        street: params.recipient_street,
        house_number: params.recipient_house_number,
        zip: params.recipient_zip,
        city: params.recipient_city,
        country_code: params.recipient_country_code,
      },
      execution_date: params.execution_date,
      qr_reference_nr: params.qr_reference_nr,
      additional_information: params.additional_information,
    };

    return withStandaloneHint(await client.createQrPayment(paymentData));
  },

  get_qr_payment: async (client, args) => {
    const { bank_account_id, payment_id } = GetQrPaymentParamsSchema.parse(args);
    const payment = await client.getQrPayment(bank_account_id, payment_id);
    if (!payment) {
      throw McpError.notFound("QR payment", payment_id);
    }
    return payment;
  },

  update_qr_payment: async (client, args) => {
    const { bank_account_id, payment_id, payment_data } = UpdateQrPaymentParamsSchema.parse(args);
    return client.updateQrPayment(bank_account_id, payment_id, payment_data);
  },
};
