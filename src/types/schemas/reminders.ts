/**
 * Reminder-related Zod schemas and types.
 * Domain: Reminders (Mahnungen)
 */

import { z } from "zod";

// List reminders for an invoice
export const ListRemindersParamsSchema = z.object({
  invoice_id: z.number().int().positive(),
});

export type ListRemindersParams = z.infer<typeof ListRemindersParamsSchema>;

// Get single reminder
export const GetReminderParamsSchema = z.object({
  invoice_id: z.number().int().positive(),
  reminder_id: z.number().int().positive(),
});

export type GetReminderParams = z.infer<typeof GetReminderParamsSchema>;

// Create reminder
export const CreateReminderParamsSchema = z.object({
  invoice_id: z.number().int().positive(),
  reminder_data: z.record(z.unknown()),
});

export type CreateReminderParams = z.infer<typeof CreateReminderParamsSchema>;

// Delete reminder
export const DeleteReminderParamsSchema = z.object({
  invoice_id: z.number().int().positive(),
  reminder_id: z.number().int().positive(),
});

export type DeleteReminderParams = z.infer<typeof DeleteReminderParamsSchema>;

// Mark reminder as sent
export const MarkReminderAsSentParamsSchema = z.object({
  invoice_id: z.number().int().positive(),
  reminder_id: z.number().int().positive(),
});

export type MarkReminderAsSentParams = z.infer<
  typeof MarkReminderAsSentParamsSchema
>;

// Send reminder
export const SendReminderParamsSchema = z.object({
  invoice_id: z.number().int().positive(),
  reminder_id: z.number().int().positive(),
});

export type SendReminderParams = z.infer<typeof SendReminderParamsSchema>;

// Mark reminder as unsent
export const MarkReminderAsUnsentParamsSchema = z.object({
  invoice_id: z.number().int().positive(),
  reminder_id: z.number().int().positive(),
});

export type MarkReminderAsUnsentParams = z.infer<
  typeof MarkReminderAsUnsentParamsSchema
>;

// Get reminder PDF
export const GetReminderPdfParamsSchema = z.object({
  invoice_id: z.number().int().positive(),
  reminder_id: z.number().int().positive(),
});

export type GetReminderPdfParams = z.infer<typeof GetReminderPdfParamsSchema>;

// Search reminders (note: reminders don't have a native Bexio search endpoint,
// this iterates invoices locally and returns all reminders)
export const SearchRemindersParamsSchema = z.object({
  query: z.string().optional(),
  field: z.string().optional(),
  operator: z.string().optional(),
  filters: z.array(z.object({
    field: z.string(),
    operator: z.string(),
    value: z.any(),
  })).optional(),
});

export type SearchRemindersParams = z.infer<typeof SearchRemindersParamsSchema>;
