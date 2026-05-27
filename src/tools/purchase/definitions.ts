/**
 * Purchase tool definitions.
 * Contains MCP tool metadata for bills, expenses, purchase orders, and outgoing payments.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const toolDefinitions: Tool[] = [
  // ===== BILLS (Creditor Invoices — v4.0 API) =====
  {
    name: "list_bills",
    description: "List all bills (creditor invoices) with optional pagination",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          description: "Maximum number of bills to return (default: 50)",
        },
        offset: {
          type: "integer",
          description: "Number of bills to skip (default: 0)",
        },
      },
    },
  },
  {
    name: "get_bill",
    description: "Get a specific bill (creditor invoice) by UUID",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        bill_id: {
          type: "string",
          description: "The UUID of the bill to retrieve",
        },
      },
      required: ["bill_id"],
    },
  },
  {
    name: "create_bill",
    description: "Create a new bill (creditor invoice) from a supplier",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        bill_data: {
          type: "object",
          description: "Bill data including contact_id, title, positions, etc.",
        },
      },
      required: ["bill_data"],
    },
  },
  {
    name: "update_bill",
    description: "Update an existing bill (creditor invoice)",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        bill_id: {
          type: "string",
          description: "The UUID of the bill to update",
        },
        bill_data: {
          type: "object",
          description: "Bill data to update",
        },
      },
      required: ["bill_id", "bill_data"],
    },
  },
  {
    name: "delete_bill",
    description: "Delete a bill (creditor invoice)",
    annotations: { destructiveHint: true },
    inputSchema: {
      type: "object",
      properties: {
        bill_id: {
          type: "string",
          description: "The UUID of the bill to delete",
        },
      },
      required: ["bill_id"],
    },
  },
  {
    name: "search_bills",
    description: "Search/filter bills (creditor invoices) by criteria. Uses GET with query params (Bexio v4.0 does not support POST /search for bills).",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        criteria: {
          type: "array",
          description: "Array of search criteria objects with field, value, and optional operator",
        },
        limit: {
          type: "integer",
          description: "Maximum number of results",
        },
        offset: {
          type: "integer",
          description: "Number of results to skip",
        },
      },
      required: ["criteria"],
    },
  },
  {
    name: "issue_bill",
    description: "Issue a bill (creditor invoice) to change its status",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        bill_id: {
          type: "string",
          description: "The UUID of the bill to issue",
        },
      },
      required: ["bill_id"],
    },
  },
  {
    name: "mark_bill_as_paid",
    description: "Mark a bill (creditor invoice) as paid",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        bill_id: {
          type: "string",
          description: "The UUID of the bill to mark as paid",
        },
      },
      required: ["bill_id"],
    },
  },

  // ===== EXPENSES (v4.0 API) =====
  {
    name: "list_expenses",
    description: "List all expenses with optional pagination",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          description: "Maximum number of expenses to return (default: 50)",
        },
        offset: {
          type: "integer",
          description: "Number of expenses to skip (default: 0)",
        },
      },
    },
  },
  {
    name: "get_expense",
    description: "Get a specific expense by UUID",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        expense_id: {
          type: "string",
          description: "The UUID of the expense to retrieve",
        },
      },
      required: ["expense_id"],
    },
  },
  {
    name: "create_expense",
    description: "Create a new expense record",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        expense_data: {
          type: "object",
          description: "Expense data including title, amount, date, etc.",
        },
      },
      required: ["expense_data"],
    },
  },
  {
    name: "update_expense",
    description: "Update an existing expense",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        expense_id: {
          type: "string",
          description: "The UUID of the expense to update",
        },
        expense_data: {
          type: "object",
          description: "Expense data to update",
        },
      },
      required: ["expense_id", "expense_data"],
    },
  },
  {
    name: "delete_expense",
    description: "Delete an expense",
    annotations: { destructiveHint: true },
    inputSchema: {
      type: "object",
      properties: {
        expense_id: {
          type: "string",
          description: "The UUID of the expense to delete",
        },
      },
      required: ["expense_id"],
    },
  },

  // ===== PURCHASE ORDERS (v3.0 API, integer IDs) =====
  {
    name: "list_purchase_orders",
    description: "List all purchase orders with optional pagination",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          description: "Maximum number of purchase orders to return (default: 50)",
        },
        offset: {
          type: "integer",
          description: "Number of purchase orders to skip (default: 0)",
        },
      },
    },
  },
  {
    name: "get_purchase_order",
    description: "Get a specific purchase order by ID",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        purchase_order_id: {
          type: "integer",
          description: "The ID of the purchase order to retrieve",
        },
      },
      required: ["purchase_order_id"],
    },
  },
  {
    name: "create_purchase_order",
    description: "Create a new purchase order to a supplier",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        purchase_order_data: {
          type: "object",
          description: "Purchase order data including contact_id, title, positions, etc.",
        },
      },
      required: ["purchase_order_data"],
    },
  },
  {
    name: "update_purchase_order",
    description: "Update an existing purchase order",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        purchase_order_id: {
          type: "integer",
          description: "The ID of the purchase order to update",
        },
        purchase_order_data: {
          type: "object",
          description: "Purchase order data to update",
        },
      },
      required: ["purchase_order_id", "purchase_order_data"],
    },
  },
  {
    name: "delete_purchase_order",
    description: "Delete a purchase order",
    annotations: { destructiveHint: true },
    inputSchema: {
      type: "object",
      properties: {
        purchase_order_id: {
          type: "integer",
          description: "The ID of the purchase order to delete",
        },
      },
      required: ["purchase_order_id"],
    },
  },

  // ===== OUTGOING PAYMENTS (v4.0 API, requires bill_id) =====
  {
    name: "list_outgoing_payments",
    description: "List outgoing payments for a specific bill. Bexio requires a bill_id (payments are listed per bill).",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        bill_id: {
          type: "string",
          description: "UUID of the bill whose outgoing payments to list (use list_bills to find)",
        },
        limit: {
          type: "integer",
          description: "Maximum number of payments to return (default: 50)",
        },
        offset: {
          type: "integer",
          description: "Number of payments to skip (default: 0)",
        },
      },
      required: ["bill_id"],
    },
  },
  {
    name: "get_outgoing_payment",
    description: "Get a specific outgoing payment by UUID",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        payment_id: {
          type: "string",
          description: "The UUID of the payment to retrieve",
        },
      },
      required: ["payment_id"],
    },
  },
  {
    name: "create_outgoing_payment",
    description: "Create a new outgoing payment",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        payment_data: {
          type: "object",
          description: "Payment data including amount, date, bill reference, etc.",
        },
      },
      required: ["payment_data"],
    },
  },
  {
    name: "update_outgoing_payment",
    description: "Update an existing outgoing payment",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        payment_id: {
          type: "string",
          description: "The UUID of the payment to update",
        },
        payment_data: {
          type: "object",
          description: "Payment data to update",
        },
      },
      required: ["payment_id", "payment_data"],
    },
  },
  {
    name: "delete_outgoing_payment",
    description: "Delete an outgoing payment",
    annotations: { destructiveHint: true },
    inputSchema: {
      type: "object",
      properties: {
        payment_id: {
          type: "string",
          description: "The UUID of the payment to delete",
        },
      },
      required: ["payment_id"],
    },
  },
];
