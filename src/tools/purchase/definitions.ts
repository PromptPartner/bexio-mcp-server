/**
 * Purchase tool definitions.
 * Contains MCP tool metadata for bills (creditor invoices) and expenses.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const toolDefinitions: Tool[] = [
  // ===== BILLS (Creditor Invoices) =====
  {
    name: "list_bills",
    description: "List all bills (creditor invoices) with optional pagination",
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
    description: "Get a specific bill (creditor invoice) by ID",
    inputSchema: {
      type: "object",
      properties: {
        bill_id: {
          type: "integer",
          description: "The ID of the bill to retrieve",
        },
      },
      required: ["bill_id"],
    },
  },
  {
    name: "create_bill",
    description: "Create a new bill (creditor invoice) from a supplier",
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
    inputSchema: {
      type: "object",
      properties: {
        bill_id: {
          type: "integer",
          description: "The ID of the bill to update",
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
    inputSchema: {
      type: "object",
      properties: {
        bill_id: {
          type: "integer",
          description: "The ID of the bill to delete",
        },
      },
      required: ["bill_id"],
    },
  },
  {
    name: "search_bills",
    description: "Search bills (creditor invoices) by criteria",
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
    inputSchema: {
      type: "object",
      properties: {
        bill_id: {
          type: "integer",
          description: "The ID of the bill to issue",
        },
      },
      required: ["bill_id"],
    },
  },
  {
    name: "mark_bill_as_paid",
    description: "Mark a bill (creditor invoice) as paid",
    inputSchema: {
      type: "object",
      properties: {
        bill_id: {
          type: "integer",
          description: "The ID of the bill to mark as paid",
        },
      },
      required: ["bill_id"],
    },
  },

  // ===== EXPENSES =====
  {
    name: "list_expenses",
    description: "List all expenses with optional pagination",
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
    description: "Get a specific expense by ID",
    inputSchema: {
      type: "object",
      properties: {
        expense_id: {
          type: "integer",
          description: "The ID of the expense to retrieve",
        },
      },
      required: ["expense_id"],
    },
  },
  {
    name: "create_expense",
    description: "Create a new expense record",
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
    inputSchema: {
      type: "object",
      properties: {
        expense_id: {
          type: "integer",
          description: "The ID of the expense to update",
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
    inputSchema: {
      type: "object",
      properties: {
        expense_id: {
          type: "integer",
          description: "The ID of the expense to delete",
        },
      },
      required: ["expense_id"],
    },
  },
];
