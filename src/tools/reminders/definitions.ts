/**
 * Reminder tool definitions.
 * Contains MCP tool metadata for reminders/Mahnungen domain.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const toolDefinitions: Tool[] = [
  {
    name: "list_reminders",
    description: "List reminders for a specific invoice",
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
    description: "Search reminders with filters",
    inputSchema: {
      type: "object",
      properties: {
        search_params: {
          type: "object",
          description: "Search parameters for reminders",
        },
      },
      required: ["search_params"],
    },
  },
  {
    name: "get_reminders_sent_this_week",
    description: "Get all reminders sent this week",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];
