/**
 * Delivery tool definitions.
 * Contains MCP tool metadata for deliveries domain.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const toolDefinitions: Tool[] = [
  {
    name: "list_deliveries",
    description: "List deliveries from Bexio with optional pagination",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          description: "Maximum number of deliveries to return (default: 50)",
          default: 50,
        },
        offset: {
          type: "integer",
          description: "Number of deliveries to skip (default: 0)",
          default: 0,
        },
      },
    },
  },
  {
    name: "get_delivery",
    description: "Get a specific delivery by ID",
    inputSchema: {
      type: "object",
      properties: {
        delivery_id: {
          type: "integer",
          description: "The ID of the delivery to retrieve",
        },
      },
      required: ["delivery_id"],
    },
  },
  {
    name: "issue_delivery",
    description: "Issue a delivery",
    inputSchema: {
      type: "object",
      properties: {
        delivery_id: {
          type: "integer",
          description: "The ID of the delivery to issue",
        },
      },
      required: ["delivery_id"],
    },
  },
  {
    name: "search_deliveries",
    description: "Search deliveries with filters",
    inputSchema: {
      type: "object",
      properties: {
        search_params: {
          type: "object",
          description: "Search parameters for deliveries",
        },
      },
      required: ["search_params"],
    },
  },
];
