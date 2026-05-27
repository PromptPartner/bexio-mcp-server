/**
 * Item tool definitions.
 * Contains MCP tool metadata for items/articles and taxes domain.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const toolDefinitions: Tool[] = [
  {
    name: "list_items",
    description: "List items from Bexio with optional pagination",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          description: "Maximum number of items to return (default: 50)",
          default: 50,
        },
        offset: {
          type: "integer",
          description: "Number of items to skip (default: 0)",
          default: 0,
        },
      },
    },
  },
  {
    name: "get_item",
    description: "Get a specific item by ID",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        item_id: {
          type: "integer",
          description: "The ID of the item to retrieve",
        },
      },
      required: ["item_id"],
    },
  },
  {
    name: "create_item",
    description: "Create a new item in Bexio",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        item_data: {
          type: "object",
          description: "Item data to create",
          properties: {
            intern_name: { type: "string", description: "Internal item name (primary name field)" },
            name_2: { type: "string", description: "Item name (secondary name field)" },
            description: { type: "string", description: "Item description" },
            internal_pos: { type: "string", description: "Internal position number" },
            unit_id: { type: "integer", description: "Unit ID" },
            purchase_price: { type: "number", description: "Purchase price" },
            sale_price: { type: "number", description: "Sale price" },
            article_type_id: { type: "integer", description: "Article type ID" },
            tax_income_id: { type: "integer", description: "Tax income ID" },
            tax_id: { type: "integer", description: "Tax ID" },
            account_id: { type: "integer", description: "Account ID" },
          },
          required: ["intern_name"],
        },
      },
      required: ["item_data"],
    },
  },
  {
    name: "list_taxes",
    description: "List taxes from Bexio with optional pagination",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          description: "Maximum number of taxes to return (default: 50)",
          default: 50,
        },
        offset: {
          type: "integer",
          description: "Number of taxes to skip (default: 0)",
          default: 0,
        },
      },
    },
  },
  {
    name: "get_tax",
    description: "Get a specific tax by ID",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        tax_id: {
          type: "integer",
          description: "The ID of the tax to retrieve",
        },
      },
      required: ["tax_id"],
    },
  },
  {
    name: "edit_item",
    description: "Edit/update an existing item",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        item_id: {
          type: "integer",
          description: "The ID of the item to edit",
        },
        item_data: {
          type: "object",
          description:
            "Fields to update on the item -- same fields as create_item",
        },
      },
      required: ["item_id", "item_data"],
    },
  },
  {
    name: "delete_item",
    description: "Delete an item",
    annotations: { destructiveHint: true },
    inputSchema: {
      type: "object",
      properties: {
        item_id: {
          type: "integer",
          description: "The ID of the item to delete",
        },
      },
      required: ["item_id"],
    },
  },
  {
    name: "search_items",
    description: "Search items by name",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query to match against item name",
        },
        limit: {
          type: "integer",
          description: "Maximum results to return (default: 100)",
          default: 100,
        },
      },
      required: ["query"],
    },
  },
];
