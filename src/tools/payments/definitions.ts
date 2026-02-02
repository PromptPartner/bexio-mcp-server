/**
 * Payment tool definitions.
 * Contains MCP tool metadata for payments domain.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const toolDefinitions: Tool[] = [
  {
    name: "list_payments",
    description: "List payments for a specific invoice",
    inputSchema: {
      type: "object",
      properties: {
        invoice_id: {
          type: "integer",
          description: "The ID of the invoice to get payments for",
        },
      },
      required: ["invoice_id"],
    },
  },
  {
    name: "get_payment",
    description: "Get a specific payment by ID",
    inputSchema: {
      type: "object",
      properties: {
        invoice_id: {
          type: "integer",
          description: "The ID of the invoice",
        },
        payment_id: {
          type: "integer",
          description: "The ID of the payment to retrieve",
        },
      },
      required: ["invoice_id", "payment_id"],
    },
  },
  {
    name: "create_payment",
    description: "Create a new payment for an invoice",
    inputSchema: {
      type: "object",
      properties: {
        invoice_id: {
          type: "integer",
          description: "The ID of the invoice to create a payment for",
        },
        payment_data: {
          type: "object",
          description: "Payment data to create",
        },
      },
      required: ["invoice_id", "payment_data"],
    },
  },
  {
    name: "delete_payment",
    description: "Delete a payment",
    inputSchema: {
      type: "object",
      properties: {
        invoice_id: {
          type: "integer",
          description: "The ID of the invoice",
        },
        payment_id: {
          type: "integer",
          description: "The ID of the payment to delete",
        },
      },
      required: ["invoice_id", "payment_id"],
    },
  },
];
