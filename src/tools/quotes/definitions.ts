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
    description: "Create a new quote (offer) for an existing contact",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        contact_id: {
          type: "integer",
          description: "The contact ID the quote should be created for",
        },
        quote_data: {
          type: "object",
          description:
            "Quote payload according to Bexio's /kb_offer schema. The contact_id is merged automatically.",
        },
      },
      required: ["contact_id", "quote_data"],
    },
  },
  {
    name: "search_quotes",
    description: "Search quotes with filters",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        search_params: {
          type: "object",
          description: "Search parameters for quotes",
        },
      },
      required: ["search_params"],
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
];
