/**
 * Reminder tool definitions.
 * Contains MCP tool metadata for reminders/Mahnungen domain.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const toolDefinitions: Tool[] = [
  {
    name: "list_reminders",
    description: "List reminders for a specific invoice",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        invoice_id: {
          type: "integer",
          description: "The ID of the invoice to get reminders for",
        },
      },
      required: ["invoice_id"],
    },
  },
  {
    name: "get_reminder",
    description: "Get a specific reminder by ID",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        invoice_id: {
          type: "integer",
          description: "The ID of the invoice",
        },
        reminder_id: {
          type: "integer",
          description: "The ID of the reminder to retrieve",
        },
      },
      required: ["invoice_id", "reminder_id"],
    },
  },
  {
    name: "create_reminder",
    description: "Create a new reminder for an invoice",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        invoice_id: {
          type: "integer",
          description: "The ID of the invoice to create a reminder for",
        },
        reminder_data: {
          type: "object",
          description: "Reminder data to create",
        },
      },
      required: ["invoice_id", "reminder_data"],
    },
  },
  {
    name: "delete_reminder",
    description: "Delete a reminder",
    annotations: { destructiveHint: true },
    inputSchema: {
      type: "object",
      properties: {
        invoice_id: {
          type: "integer",
          description: "The ID of the invoice",
        },
        reminder_id: {
          type: "integer",
          description: "The ID of the reminder to delete",
        },
      },
      required: ["invoice_id", "reminder_id"],
    },
  },
  {
    name: "mark_reminder_as_sent",
    description: "Mark a reminder as sent",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        invoice_id: {
          type: "integer",
          description: "The ID of the invoice",
        },
        reminder_id: {
          type: "integer",
          description: "The ID of the reminder to mark as sent",
        },
      },
      required: ["invoice_id", "reminder_id"],
    },
  },
  {
    name: "send_reminder",
    description: "Send a reminder",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        invoice_id: {
          type: "integer",
          description: "The ID of the invoice",
        },
        reminder_id: {
          type: "integer",
          description: "The ID of the reminder to send",
        },
      },
      required: ["invoice_id", "reminder_id"],
    },
  },
  {
    name: "search_reminders",
    description: "Search reminders across recent invoices. Fetches all reminders and returns them (no native Bexio search endpoint for reminders).",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_reminders_sent_this_week",
    description: "Get all reminders sent this week",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "mark_reminder_as_unsent",
    description: "Mark a reminder as unsent (reverse of mark as sent)",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        invoice_id: {
          type: "integer",
          description: "The ID of the invoice",
        },
        reminder_id: {
          type: "integer",
          description: "The ID of the reminder to mark as unsent",
        },
      },
      required: ["invoice_id", "reminder_id"],
    },
  },
  {
    name: "get_reminder_pdf",
    description: "Get a reminder as PDF (returns base64-encoded content)",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        invoice_id: {
          type: "integer",
          description: "The ID of the invoice",
        },
        reminder_id: {
          type: "integer",
          description: "The ID of the reminder to get as PDF",
        },
      },
      required: ["invoice_id", "reminder_id"],
    },
  },
];
