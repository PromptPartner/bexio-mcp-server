/**
 * Delivery tool definitions.
 * Contains MCP tool metadata for deliveries domain.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const toolDefinitions: Tool[] = [
  {
    name: "list_deliveries",
    description: "List deliveries from Bexio with optional pagination",
    annotations: { readOnlyHint: true },
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
    annotations: { readOnlyHint: true },
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
    annotations: { destructiveHint: false },
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
    description: "Search deliveries via the Bexio search endpoint. Use query for simple text search, or filters for advanced criteria.",
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
];
