/**
 * Purchase tool handlers.
 * Implements the logic for bills, expenses, purchase orders, and outgoing payments.
 */

import { BexioClient } from "../../bexio-client.js";
import { McpError } from "../../shared/errors.js";
import {
  ListBillsParamsSchema,
  GetBillParamsSchema,
  CreateBillParamsSchema,
  UpdateBillParamsSchema,
  DeleteBillParamsSchema,
  SearchBillsParamsSchema,
  IssueBillParamsSchema,
  MarkBillAsPaidParamsSchema,
  ListExpensesParamsSchema,
  GetExpenseParamsSchema,
  CreateExpenseParamsSchema,
  UpdateExpenseParamsSchema,
  DeleteExpenseParamsSchema,
  ListPurchaseOrdersParamsSchema,
  GetPurchaseOrderParamsSchema,
  CreatePurchaseOrderParamsSchema,
  UpdatePurchaseOrderParamsSchema,
  DeletePurchaseOrderParamsSchema,
  ListOutgoingPaymentsParamsSchema,
  GetOutgoingPaymentParamsSchema,
  CreateOutgoingPaymentParamsSchema,
  UpdateOutgoingPaymentParamsSchema,
  DeleteOutgoingPaymentParamsSchema,
} from "../../types/index.js";

export type HandlerFn = (
  client: BexioClient,
  args: unknown
) => Promise<unknown>;

export const handlers: Record<string, HandlerFn> = {
  // ===== BILLS (v4.0, UUID IDs) =====
  list_bills: async (client, args) => {
    const { limit, offset } = ListBillsParamsSchema.parse(args);
    return client.listBills({ limit, offset });
  },

  get_bill: async (client, args) => {
    const { bill_id } = GetBillParamsSchema.parse(args);
    const bill = await client.getBill(bill_id);
    if (!bill) {
      throw McpError.notFound("Bill", bill_id);
    }
    return bill;
  },

  create_bill: async (client, args) => {
    const { bill_data } = CreateBillParamsSchema.parse(args);
    return client.createBill(bill_data);
  },

  update_bill: async (client, args) => {
    const { bill_id, bill_data } = UpdateBillParamsSchema.parse(args);
    return client.updateBill(bill_id, bill_data);
  },

  delete_bill: async (client, args) => {
    const { bill_id } = DeleteBillParamsSchema.parse(args);
    return client.deleteBill(bill_id);
  },

  search_bills: async (client, args) => {
    const { criteria, limit, offset } = SearchBillsParamsSchema.parse(args);
    return client.searchBills(criteria, { limit, offset });
  },

  issue_bill: async (client, args) => {
    const { bill_id } = IssueBillParamsSchema.parse(args);
    return client.issueBill(bill_id);
  },

  mark_bill_as_paid: async (client, args) => {
    const { bill_id } = MarkBillAsPaidParamsSchema.parse(args);
    return client.markBillAsPaid(bill_id);
  },

  // ===== EXPENSES (v3.0, UUID IDs) =====
  list_expenses: async (client, args) => {
    const { limit, offset } = ListExpensesParamsSchema.parse(args);
    return client.listExpenses({ limit, offset });
  },

  get_expense: async (client, args) => {
    const { expense_id } = GetExpenseParamsSchema.parse(args);
    const expense = await client.getExpense(expense_id);
    if (!expense) {
      throw McpError.notFound("Expense", expense_id);
    }
    return expense;
  },

  create_expense: async (client, args) => {
    const { expense_data } = CreateExpenseParamsSchema.parse(args);
    return client.createExpense(expense_data);
  },

  update_expense: async (client, args) => {
    const { expense_id, expense_data } = UpdateExpenseParamsSchema.parse(args);
    return client.updateExpense(expense_id, expense_data);
  },

  delete_expense: async (client, args) => {
    const { expense_id } = DeleteExpenseParamsSchema.parse(args);
    return client.deleteExpense(expense_id);
  },

  // ===== PURCHASE ORDERS (v3.0, integer IDs) =====
  list_purchase_orders: async (client, args) => {
    const { limit, offset } = ListPurchaseOrdersParamsSchema.parse(args);
    return client.listPurchaseOrders({ limit, offset });
  },

  get_purchase_order: async (client, args) => {
    const { purchase_order_id } = GetPurchaseOrderParamsSchema.parse(args);
    const purchaseOrder = await client.getPurchaseOrder(purchase_order_id);
    if (!purchaseOrder) {
      throw McpError.notFound("Purchase Order", purchase_order_id);
    }
    return purchaseOrder;
  },

  create_purchase_order: async (client, args) => {
    const { purchase_order_data } = CreatePurchaseOrderParamsSchema.parse(args);
    return client.createPurchaseOrder(purchase_order_data);
  },

  update_purchase_order: async (client, args) => {
    const { purchase_order_id, purchase_order_data } = UpdatePurchaseOrderParamsSchema.parse(args);
    return client.updatePurchaseOrder(purchase_order_id, purchase_order_data);
  },

  delete_purchase_order: async (client, args) => {
    const { purchase_order_id } = DeletePurchaseOrderParamsSchema.parse(args);
    return client.deletePurchaseOrder(purchase_order_id);
  },

  // ===== OUTGOING PAYMENTS (v4.0, flat endpoint, UUID IDs) =====
  list_outgoing_payments: async (client, args) => {
    const { limit, offset } = ListOutgoingPaymentsParamsSchema.parse(args);
    return client.listOutgoingPayments({ limit, offset });
  },

  get_outgoing_payment: async (client, args) => {
    const { payment_id } = GetOutgoingPaymentParamsSchema.parse(args);
    const payment = await client.getOutgoingPayment(payment_id);
    if (!payment) {
      throw McpError.notFound("Outgoing Payment", payment_id);
    }
    return payment;
  },

  create_outgoing_payment: async (client, args) => {
    const { payment_data } = CreateOutgoingPaymentParamsSchema.parse(args);
    return client.createOutgoingPayment(payment_data);
  },

  update_outgoing_payment: async (client, args) => {
    const { payment_id, payment_data } = UpdateOutgoingPaymentParamsSchema.parse(args);
    return client.updateOutgoingPayment(payment_id, payment_data);
  },

  delete_outgoing_payment: async (client, args) => {
    const { payment_id } = DeleteOutgoingPaymentParamsSchema.parse(args);
    return client.deleteOutgoingPayment(payment_id);
  },
};
