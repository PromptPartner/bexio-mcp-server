/**
 * Invoice tool definitions.
 * Contains MCP tool metadata for invoices domain.
 */
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const toolDefinitions: Tool[] = [
  {
    name: "list_invoices",
    description: "List invoices from Bexio with optional pagination",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "integer", description: "Maximum number to return (default: 50)", default: 50 },
        offset: { type: "integer", description: "Number to skip (default: 0)", default: 0 },
      },
    },
  },
  {
    name: "list_all_invoices",
    description: "List every invoice in Bexio by paging automatically",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        chunk_size: { type: "integer", description: "Invoices per request (default: 100)", default: 100 },
      },
    },
  },
  {
    name: "get_invoice",
    description: "Get a specific invoice by ID",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: { invoice_id: { type: "integer", description: "The invoice ID" } },
      required: ["invoice_id"],
    },
  },
  {
    name: "search_invoices",
    description: "Search invoices via the Bexio search endpoint",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Free-text value matched with LIKE" },
        field: { type: "string", description: "Field to search (default: title)", default: "title" },
        operator: { type: "string", description: "Comparison operator (LIKE, =, >)", default: "LIKE" },
        filters: {
          type: "array", description: "Explicit Bexio search filters",
          items: {
            type: "object",
            properties: { field: { type: "string" }, operator: { type: "string" }, value: {} },
            required: ["field", "operator", "value"],
          },
        },
        limit: { type: "integer", description: "Maximum results" },
      },
    },
  },
  {
    name: "search_invoices_by_customer",
    description: "Search invoices by customer name (finds contact, then invoices)",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        customer_name: { type: "string", description: "Customer name to search for" },
        limit: { type: "integer", description: "Maximum invoices to return (default: 50)", default: 50 },
      },
      required: ["customer_name"],
    },
  },
  {
    name: "create_invoice",
    description: "Create a new invoice in Bexio",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: { invoice_data: { type: "object", description: "Invoice data to create" } },
      required: ["invoice_data"],
    },
  },
  {
    name: "issue_invoice",
    description: "Issue an invoice",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: { invoice_id: { type: "integer", description: "The invoice ID to issue" } },
      required: ["invoice_id"],
    },
  },
  {
    name: "cancel_invoice",
    description: "Cancel an invoice",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: { invoice_id: { type: "integer", description: "The invoice ID to cancel" } },
      required: ["invoice_id"],
    },
  },
  {
    name: "mark_invoice_as_sent",
    description: "Mark an invoice as sent",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: { invoice_id: { type: "integer", description: "The invoice ID to mark as sent" } },
      required: ["invoice_id"],
    },
  },
  {
    name: "send_invoice",
    description: "Send an invoice",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: { invoice_id: { type: "integer", description: "The invoice ID to send" } },
      required: ["invoice_id"],
    },
  },
  {
    name: "copy_invoice",
    description: "Copy an invoice",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: { invoice_id: { type: "integer", description: "The invoice ID to copy" } },
      required: ["invoice_id"],
    },
  },
  {
    name: "list_invoice_statuses",
    description: "List all available invoice statuses with their meanings",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "list_all_statuses",
    description: "List all document statuses for invoices, quotes, and orders",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        document_type: {
          type: "string", enum: ["all", "invoices", "quotes", "orders"],
          description: "Filter by document type (default: all)", default: "all",
        },
      },
    },
  },
  {
    name: "get_open_invoices",
    description: "Get all open invoices (draft and sent/pending)",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "get_overdue_invoices",
    description: "Get all overdue invoices",
    annotations: { readOnlyHint: true },
    inputSchema: { type: "object", properties: {} },
  },
];
