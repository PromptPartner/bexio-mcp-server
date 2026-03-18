/**
 * Reminder tool handlers.
 * Implements the logic for each reminder tool.
 */

import { BexioClient } from "../../bexio-client.js";
import { McpError } from "../../shared/errors.js";
import {
  ListRemindersParamsSchema,
  GetReminderParamsSchema,
  CreateReminderParamsSchema,
  DeleteReminderParamsSchema,
  MarkReminderAsSentParamsSchema,
  MarkReminderAsUnsentParamsSchema,
  GetReminderPdfParamsSchema,
  SendReminderParamsSchema,
} from "../../types/index.js";

export type HandlerFn = (
  client: BexioClient,
  args: unknown
) => Promise<unknown>;

export const handlers: Record<string, HandlerFn> = {
  list_reminders: async (client, args) => {
    const { invoice_id } = ListRemindersParamsSchema.parse(args);
    return client.listReminders(invoice_id);
  },

  get_reminder: async (client, args) => {
    const { invoice_id, reminder_id } = GetReminderParamsSchema.parse(args);
    const reminder = await client.getReminder(invoice_id, reminder_id);
    if (!reminder) {
      throw McpError.notFound("Reminder", reminder_id);
    }
    return reminder;
  },

  create_reminder: async (client, args) => {
    const { invoice_id, reminder_data } = CreateReminderParamsSchema.parse(args);
    return client.createReminder(invoice_id, reminder_data);
  },

  delete_reminder: async (client, args) => {
    const { invoice_id, reminder_id } = DeleteReminderParamsSchema.parse(args);
    return client.deleteReminder(invoice_id, reminder_id);
  },

  mark_reminder_as_sent: async (client, args) => {
    const { invoice_id, reminder_id } = MarkReminderAsSentParamsSchema.parse(args);
    return client.markReminderAsSent(invoice_id, reminder_id);
  },

  send_reminder: async (client, args) => {
    const { invoice_id, reminder_id } = SendReminderParamsSchema.parse(args);
    return client.sendReminder(invoice_id, reminder_id);
  },

  search_reminders: async (client, _args) => {
    return client.searchReminders({});
  },

  get_reminders_sent_this_week: async (client) => {
    return client.getRemindersSentThisWeek();
  },

  mark_reminder_as_unsent: async (client, args) => {
    const { invoice_id, reminder_id } =
      MarkReminderAsUnsentParamsSchema.parse(args);
    return client.markReminderAsUnsent(invoice_id, reminder_id);
  },

  get_reminder_pdf: async (client, args) => {
    const { invoice_id, reminder_id } =
      GetReminderPdfParamsSchema.parse(args);
    return client.getReminderPdf(invoice_id, reminder_id);
  },
};
