/**
 * Order tool definitions.
 * Contains MCP tool metadata for orders domain.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const toolDefinitions: Tool[] = [
  {
    name: "list_orders",
    description: "List orders from Bexio with optional pagination",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          description: "Maximum number of orders to return (default: 50)",
          default: 50,
        },
        offset: {
          type: "integer",
          description: "Number of orders to skip (default: 0)",
          default: 0,
        },
      },
    },
  },
  {
    name: "get_order",
    description: "Get a specific order by ID",
    inputSchema: {
      type: "object",
      properties: {
        order_id: {
          type: "integer",
          description: "The ID of the order to retrieve",
        },
      },
      required: ["order_id"],
    },
  },
  {
    name: "create_order",
    description: "Create a new order in Bexio",
    inputSchema: {
      type: "object",
      properties: {
        order_data: {
          type: "object",
          description: "Order data to create",
        },
      },
      required: ["order_data"],
    },
  },
  {
    name: "search_orders",
    description: "Search orders with filters",
    inputSchema: {
      type: "object",
      properties: {
        search_params: {
          type: "object",
          description: "Search parameters for orders",
        },
      },
      required: ["search_params"],
    },
  },
  {
    name: "search_orders_by_customer",
    description:
      "Search orders by customer name (2-step process: find contact by name, then find orders by contact_id)",
    inputSchema: {
      type: "object",
      properties: {
        customer_name: {
          type: "string",
          description: 'Customer name to search for (e.g., "Anton", "Mustermann")',
        },
        limit: {
          type: "integer",
          description: "Maximum number of orders to return (default: 50)",
          default: 50,
        },
      },
      required: ["customer_name"],
    },
  },
  {
    name: "create_delivery_from_order",
    description: "Create a delivery from an order",
    inputSchema: {
      type: "object",
      properties: {
        order_id: {
          type: "integer",
          description: "The ID of the order to create a delivery from",
        },
      },
      required: ["order_id"],
    },
  },
  {
    name: "create_invoice_from_order",
    description: "Create an invoice from an order",
    inputSchema: {
      type: "object",
      properties: {
        order_id: {
          type: "integer",
          description: "The ID of the order to create an invoice from",
        },
      },
      required: ["order_id"],
    },
  },
];
