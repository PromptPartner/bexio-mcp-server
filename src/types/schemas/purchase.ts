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
