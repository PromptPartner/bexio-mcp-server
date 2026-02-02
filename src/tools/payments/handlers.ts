/**
 * Payment tool handlers.
 * Implements the logic for each payment tool.
 */

import { BexioClient } from "../../bexio-client.js";
import { McpError } from "../../shared/errors.js";
import {
  ListPaymentsParamsSchema,
  GetPaymentParamsSchema,
  CreatePaymentParamsSchema,
  DeletePaymentParamsSchema,
} from "../../types/index.js";

export type HandlerFn = (
  client: BexioClient,
  args: unknown
) => Promise<unknown>;

export const handlers: Record<string, HandlerFn> = {
  list_payments: async (client, args) => {
    const { invoice_id } = ListPaymentsParamsSchema.parse(args);
    return client.listPayments(invoice_id);
  },

  get_payment: async (client, args) => {
    const { invoice_id, payment_id } = GetPaymentParamsSchema.parse(args);
    const payment = await client.getPayment(invoice_id, payment_id);
    if (!payment) {
      throw McpError.notFound("Payment", payment_id);
    }
    return payment;
  },

  create_payment: async (client, args) => {
    const { invoice_id, payment_data } = CreatePaymentParamsSchema.parse(args);
    return client.createPayment(invoice_id, payment_data);
  },

  delete_payment: async (client, args) => {
    const { invoice_id, payment_id } = DeletePaymentParamsSchema.parse(args);
    return client.deletePayment(invoice_id, payment_id);
  },
};
