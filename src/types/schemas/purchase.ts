/**
 * Purchase-related Zod schemas and types.
 * Domain: Bills (kb_bill) and Expenses (kb_expense)
 */

import { z } from "zod";

// ===== BILLS (Creditor Invoices) =====

// List bills
export const ListBillsParamsSchema = z.object({
  limit: z.number().int().positive().default(50),
  offset: z.number().int().min(0).default(0),
});

export type ListBillsParams = z.infer<typeof ListBillsParamsSchema>;

// Get single bill
export const GetBillParamsSchema = z.object({
  bill_id: z.number().int().positive(),
});

export type GetBillParams = z.infer<typeof GetBillParamsSchema>;

// Create bill
export const CreateBillParamsSchema = z.object({
  bill_data: z.record(z.unknown()),
});

export type CreateBillParams = z.infer<typeof CreateBillParamsSchema>;

// Update bill
export const UpdateBillParamsSchema = z.object({
  bill_id: z.number().int().positive(),
  bill_data: z.record(z.unknown()),
});

export type UpdateBillParams = z.infer<typeof UpdateBillParamsSchema>;

// Delete bill
export const DeleteBillParamsSchema = z.object({
  bill_id: z.number().int().positive(),
});

export type DeleteBillParams = z.infer<typeof DeleteBillParamsSchema>;

// Search bills
export const SearchBillsParamsSchema = z.object({
  criteria: z.array(z.record(z.unknown())),
  limit: z.number().int().positive().optional(),
  offset: z.number().int().min(0).optional(),
});

export type SearchBillsParams = z.infer<typeof SearchBillsParamsSchema>;

// Issue bill
export const IssueBillParamsSchema = z.object({
  bill_id: z.number().int().positive(),
});

export type IssueBillParams = z.infer<typeof IssueBillParamsSchema>;

// Mark bill as paid
export const MarkBillAsPaidParamsSchema = z.object({
  bill_id: z.number().int().positive(),
});

export type MarkBillAsPaidParams = z.infer<typeof MarkBillAsPaidParamsSchema>;

// ===== EXPENSES =====

// List expenses
export const ListExpensesParamsSchema = z.object({
  limit: z.number().int().positive().default(50),
  offset: z.number().int().min(0).default(0),
});

export type ListExpensesParams = z.infer<typeof ListExpensesParamsSchema>;

// Get single expense
export const GetExpenseParamsSchema = z.object({
  expense_id: z.number().int().positive(),
});

export type GetExpenseParams = z.infer<typeof GetExpenseParamsSchema>;

// Create expense
export const CreateExpenseParamsSchema = z.object({
  expense_data: z.record(z.unknown()),
});

export type CreateExpenseParams = z.infer<typeof CreateExpenseParamsSchema>;

// Update expense
export const UpdateExpenseParamsSchema = z.object({
  expense_id: z.number().int().positive(),
  expense_data: z.record(z.unknown()),
});

export type UpdateExpenseParams = z.infer<typeof UpdateExpenseParamsSchema>;

// Delete expense
export const DeleteExpenseParamsSchema = z.object({
  expense_id: z.number().int().positive(),
});

export type DeleteExpenseParams = z.infer<typeof DeleteExpenseParamsSchema>;

// ===== PURCHASE ORDERS =====

// List purchase orders
export const ListPurchaseOrdersParamsSchema = z.object({
  limit: z.number().int().positive().default(50),
  offset: z.number().int().min(0).default(0),
});

export type ListPurchaseOrdersParams = z.infer<typeof ListPurchaseOrdersParamsSchema>;

// Get single purchase order
export const GetPurchaseOrderParamsSchema = z.object({
  purchase_order_id: z.number().int().positive(),
});

export type GetPurchaseOrderParams = z.infer<typeof GetPurchaseOrderParamsSchema>;

// Create purchase order
export const CreatePurchaseOrderParamsSchema = z.object({
  purchase_order_data: z.record(z.unknown()),
});

export type CreatePurchaseOrderParams = z.infer<typeof CreatePurchaseOrderParamsSchema>;

// Update purchase order
export const UpdatePurchaseOrderParamsSchema = z.object({
  purchase_order_id: z.number().int().positive(),
  purchase_order_data: z.record(z.unknown()),
});

export type UpdatePurchaseOrderParams = z.infer<typeof UpdatePurchaseOrderParamsSchema>;

// Delete purchase order
export const DeletePurchaseOrderParamsSchema = z.object({
  purchase_order_id: z.number().int().positive(),
});

export type DeletePurchaseOrderParams = z.infer<typeof DeletePurchaseOrderParamsSchema>;

// ===== OUTGOING PAYMENTS (linked to bills) =====

// List outgoing payments for a bill
export const ListOutgoingPaymentsParamsSchema = z.object({
  bill_id: z.number().int().positive(),
});

export type ListOutgoingPaymentsParams = z.infer<typeof ListOutgoingPaymentsParamsSchema>;

// Get single outgoing payment
export const GetOutgoingPaymentParamsSchema = z.object({
  bill_id: z.number().int().positive(),
  payment_id: z.number().int().positive(),
});

export type GetOutgoingPaymentParams = z.infer<typeof GetOutgoingPaymentParamsSchema>;

// Create outgoing payment
export const CreateOutgoingPaymentParamsSchema = z.object({
  bill_id: z.number().int().positive(),
  payment_data: z.record(z.unknown()),
});

export type CreateOutgoingPaymentParams = z.infer<typeof CreateOutgoingPaymentParamsSchema>;

// Update outgoing payment
export const UpdateOutgoingPaymentParamsSchema = z.object({
  bill_id: z.number().int().positive(),
  payment_id: z.number().int().positive(),
  payment_data: z.record(z.unknown()),
});

export type UpdateOutgoingPaymentParams = z.infer<typeof UpdateOutgoingPaymentParamsSchema>;

// Delete outgoing payment
export const DeleteOutgoingPaymentParamsSchema = z.object({
  bill_id: z.number().int().positive(),
  payment_id: z.number().int().positive(),
});

export type DeleteOutgoingPaymentParams = z.infer<typeof DeleteOutgoingPaymentParamsSchema>;
