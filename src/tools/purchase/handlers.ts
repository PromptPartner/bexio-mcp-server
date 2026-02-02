/**
 * Purchase tool handlers.
 * Implements the logic for bills (creditor invoices) and expenses.
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
} from "../../types/index.js";

export type HandlerFn = (
  client: BexioClient,
  args: unknown
) => Promise<unknown>;

export const handlers: Record<string, HandlerFn> = {
  // ===== BILLS =====
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

  // ===== EXPENSES =====
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
};
