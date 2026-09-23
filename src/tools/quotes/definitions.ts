/**
 * Quote tool definitions.
 * Contains MCP tool metadata for quotes/offers domain.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const toolDefinitions: Tool[] = [
  {
    name: "list_quotes",
    description: "List quotes (offers) from Bexio with optional pagination",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          description: "Maximum number of quotes to return (default: 50)",
          default: 50,
        },
        offset: {
          type: "integer",
          description: "Number of quotes to skip (default: 0)",
          default: 0,
        },
      },
    },
  },
  {
    name: "get_quote",
    description: "Get a specific quote by ID",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        quote_id: {
          type: "integer",
          description: "The ID of the quote to retrieve",
        },
      },
      required: ["quote_id"],
    },
  },
  {
    name: "create_quote",
    description: "Create a new quote (offer) for an existing contact. Use get_current_user to obtain user_id first.",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        contact_id: {
          type: "integer",
          description: "The contact ID the quote should be created for",
        },
        user_id: {
          type: "integer",
          description: "The Bexio user ID (owner of the quote). Get via get_current_user.",
        },
        quote_data: {
          type: "object",
          description:
            "Quote payload according to Bexio's /kb_offer schema. contact_id and user_id are merged automatically.",
        },
      },
      required: ["contact_id", "user_id", "quote_data"],
    },
  },
  {
    name: "search_quotes",
    description: "Search quotes via the Bexio search endpoint. Use query for simple text search, or filters for advanced criteria.",
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
    name: "search_quotes_by_customer",
    description:
      "Search quotes by customer name (2-step process: find contact by name, then find quotes by contact_id)",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        customer_name: {
          type: "string",
          description: 'Customer name to search for (e.g., "Anton", "Mustermann")',
        },
        limit: {
          type: "integer",
          description: "Maximum number of quotes to return (default: 50)",
          default: 50,
        },
      },
      required: ["customer_name"],
    },
  },
  {
    name: "issue_quote",
    description: "Issue a quote",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        quote_id: {
          type: "integer",
          description: "The ID of the quote to issue",
        },
      },
      required: ["quote_id"],
    },
  },
  {
    name: "accept_quote",
    description: "Accept a quote",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        quote_id: {
          type: "integer",
          description: "The ID of the quote to accept",
        },
      },
      required: ["quote_id"],
    },
  },
  {
    name: "decline_quote",
    description: "Decline a quote",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        quote_id: {
          type: "integer",
          description: "The ID of the quote to decline",
        },
      },
      required: ["quote_id"],
    },
  },
  {
    name: "send_quote",
    description: "Send a quote",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        quote_id: {
          type: "integer",
          description: "The ID of the quote to send",
        },
      },
      required: ["quote_id"],
    },
  },
  {
    name: "create_order_from_quote",
    description: "Create an order from a quote",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        quote_id: {
          type: "integer",
          description: "The ID of the quote to create an order from",
        },
      },
      required: ["quote_id"],
    },
  },
  {
    name: "create_invoice_from_quote",
    description: "Create an invoice from a quote",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        quote_id: {
          type: "integer",
          description: "The ID of the quote to create an invoice from",
        },
      },
      required: ["quote_id"],
    },
  },
  {
    name: "edit_quote",
    description: "Edit/update an existing quote",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        quote_id: {
          type: "integer",
          description: "The ID of the quote to edit",
        },
        quote_data: {
          type: "object",
          description: "Fields to update on the quote",
        },
      },
      required: ["quote_id", "quote_data"],
    },
  },
  {
    name: "delete_quote",
    description: "Delete a quote",
    annotations: { destructiveHint: true },
    inputSchema: {
      type: "object",
      properties: {
        quote_id: {
          type: "integer",
          description: "The ID of the quote to delete",
        },
      },
      required: ["quote_id"],
    },
  },
  {
    name: "revert_quote_to_draft",
    description: "Revert an issued quote back to draft status",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        quote_id: {
          type: "integer",
          description: "The ID of the quote to revert to draft",
        },
      },
      required: ["quote_id"],
    },
  },
  {
    name: "reissue_quote",
    description: "Reissue a quote (re-issue after revert)",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        quote_id: {
          type: "integer",
          description: "The ID of the quote to reissue",
        },
      },
      required: ["quote_id"],
    },
  },
  {
    name: "mark_quote_as_sent",
    description: "Mark a quote as sent",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        quote_id: {
          type: "integer",
          description: "The ID of the quote to mark as sent",
        },
      },
      required: ["quote_id"],
    },
  },
  {
    name: "get_quote_pdf",
    description: "Get a quote as PDF (returns base64-encoded content)",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        quote_id: {
          type: "integer",
          description: "The ID of the quote to get as PDF",
        },
      },
      required: ["quote_id"],
    },
  },
  {
    name: "copy_quote",
    description: "Copy/duplicate a quote",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        quote_id: {
          type: "integer",
          description: "The ID of the quote to copy",
        },
      },
      required: ["quote_id"],
    },
  },
];
