/**
 * Purchase-related Zod schemas and types.
 * Domain: Bills (v4.0), Expenses (v3.0), Purchase Orders (v3.0), Outgoing Payments (v4.0)
 */

import { z } from "zod";

// ===== BILLS (Creditor Invoices — v4.0 API, UUID IDs) =====

// List bills
export const ListBillsParamsSchema = z.object({
  limit: z.number().int().positive().default(50),
  offset: z.number().int().min(0).default(0),
});

export type ListBillsParams = z.infer<typeof ListBillsParamsSchema>;

// Get single bill
export const GetBillParamsSchema = z.object({
  bill_id: z.string(),
});

export type GetBillParams = z.infer<typeof GetBillParamsSchema>;

// Create bill
export const CreateBillParamsSchema = z.object({
  bill_data: z.record(z.unknown()),
});

export type CreateBillParams = z.infer<typeof CreateBillParamsSchema>;

// Update bill
export const UpdateBillParamsSchema = z.object({
  bill_id: z.string(),
  bill_data: z.record(z.unknown()),
});

export type UpdateBillParams = z.infer<typeof UpdateBillParamsSchema>;

// Delete bill
export const DeleteBillParamsSchema = z.object({
  bill_id: z.string(),
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
  bill_id: z.string(),
});

export type IssueBillParams = z.infer<typeof IssueBillParamsSchema>;

// Mark bill as paid
export const MarkBillAsPaidParamsSchema = z.object({
  bill_id: z.string(),
});

export type MarkBillAsPaidParams = z.infer<typeof MarkBillAsPaidParamsSchema>;

// ===== EXPENSES (v3.0 API, UUID IDs) =====

// List expenses
export const ListExpensesParamsSchema = z.object({
  limit: z.number().int().positive().default(50),
  offset: z.number().int().min(0).default(0),
});

export type ListExpensesParams = z.infer<typeof ListExpensesParamsSchema>;

// Get single expense
export const GetExpenseParamsSchema = z.object({
  expense_id: z.string(),
});

export type GetExpenseParams = z.infer<typeof GetExpenseParamsSchema>;

// Create expense
export const CreateExpenseParamsSchema = z.object({
  expense_data: z.record(z.unknown()),
});

export type CreateExpenseParams = z.infer<typeof CreateExpenseParamsSchema>;

// Update expense
export const UpdateExpenseParamsSchema = z.object({
  expense_id: z.string(),
  expense_data: z.record(z.unknown()),
});

export type UpdateExpenseParams = z.infer<typeof UpdateExpenseParamsSchema>;

// Delete expense
export const DeleteExpenseParamsSchema = z.object({
  expense_id: z.string(),
});

export type DeleteExpenseParams = z.infer<typeof DeleteExpenseParamsSchema>;

// ===== PURCHASE ORDERS (v3.0 API, integer IDs) =====

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

// ===== OUTGOING PAYMENTS (v4.0 API, flat endpoint, UUID IDs) =====

// List outgoing payments (flat — no longer nested under bills)
export const ListOutgoingPaymentsParamsSchema = z.object({
  // Bexio's v4.0 GET /purchase/outgoing-payments requires a bill_id (payments
  // are listed per bill); omitting it returns HTTP 400.
  bill_id: z.string().describe("UUID of the bill whose outgoing payments to list"),
  limit: z.number().int().positive().default(50),
  offset: z.number().int().min(0).default(0),
});

export type ListOutgoingPaymentsParams = z.infer<typeof ListOutgoingPaymentsParamsSchema>;

// Get single outgoing payment
export const GetOutgoingPaymentParamsSchema = z.object({
  payment_id: z.string(),
});

export type GetOutgoingPaymentParams = z.infer<typeof GetOutgoingPaymentParamsSchema>;

// Create outgoing payment
export const CreateOutgoingPaymentParamsSchema = z.object({
  payment_data: z.record(z.unknown()),
});

export type CreateOutgoingPaymentParams = z.infer<typeof CreateOutgoingPaymentParamsSchema>;

// Update outgoing payment
export const UpdateOutgoingPaymentParamsSchema = z.object({
  payment_id: z.string(),
  payment_data: z.record(z.unknown()),
});

export type UpdateOutgoingPaymentParams = z.infer<typeof UpdateOutgoingPaymentParamsSchema>;

// Delete outgoing payment
export const DeleteOutgoingPaymentParamsSchema = z.object({
  payment_id: z.string(),
});

export type DeleteOutgoingPaymentParams = z.infer<typeof DeleteOutgoingPaymentParamsSchema>;
