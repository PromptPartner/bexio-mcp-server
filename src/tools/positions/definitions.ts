/**
 * Position tool definitions.
 * Contains MCP tool metadata for all 7 position types across sales documents.
 * 35 tools total: 7 types x 5 operations (list, get, create, edit, delete).
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * Position type metadata for programmatic tool generation.
 */
const POSITION_TYPES = [
  {
    key: "default",
    label: "default (custom)",
    createHint:
      "Custom free-text line item. Required fields: text (string), amount (string, e.g. '2'), unit_price (string, e.g. '160'), tax_id (integer), account_id (integer — MUST be looked up via search_accounts or list_accounts, do NOT guess). Optional: discount_in_percent (string), unit_id (integer), parent_id (integer — set to a sub_position ID to nest this item inside a Sammelposition/group).",
  },
  {
    key: "item",
    label: "item (article/product)",
    createHint:
      "Article/product from catalog. Required fields: article_id (integer), amount (string), unit_price (string), tax_id (integer), account_id (integer — MUST be looked up via search_accounts or list_accounts, do NOT guess). Optional: discount_in_percent (string), text (string override), parent_id (integer — to nest inside a sub_position group).",
  },
  {
    key: "text",
    label: "text",
    createHint:
      "Descriptive text block (no price). Fields: text (string, required), show_pos_nr (boolean, optional). Use for section headers, notes, or descriptions.",
  },
  {
    key: "subtotal",
    label: "subtotal",
    createHint:
      "Running subtotal at this position. Sums all preceding positions since the last subtotal. No fields needed — just provide document_type and document_id.",
    noBody: true,
  },
  {
    key: "discount",
    label: "discount",
    createHint:
      "Discount line. Required fields: text (string), is_percentual (boolean), value (string — percentage or absolute amount). Optional: discount_total (string).",
  },
  {
    key: "pagebreak",
    label: "pagebreak",
    createHint:
      "Page break for PDF generation. No fields needed — just provide document_type and document_id.",
    noBody: true,
  },
  {
    key: "sub",
    label: "sub (Sammelposition/group header)",
    createHint:
      "Group header (Sammelposition) that groups child positions. Fields: text (string, required — group title), show_pos_nr (boolean, optional). Does NOT accept price fields (amount, unit_price, tax_id). Prices come from child positions created with create_default_position using parent_id set to this position's ID.",
  },
] as const;

/** Shared document/position base properties for list operations */
const listProperties = {
  document_type: {
    type: "string" as const,
    enum: ["quote", "order", "invoice"],
    description: "Type of sales document (quote, order, or invoice)",
  },
  document_id: {
    type: "integer" as const,
    description: "ID of the sales document",
  },
};

/** Additional property for single-position operations */
const positionIdProperty = {
  position_id: {
    type: "integer" as const,
    description: "ID of the position",
  },
};

/** Additional property for create/edit operations */
const positionDataProperty = {
  position_data: {
    type: "object" as const,
    description: "Position data payload",
  },
};

/**
 * Generate 5 MCP tool definitions for a single position type.
 */
function makePositionTools(type: { key: string; label: string; createHint: string; noBody?: boolean }): Tool[] {
  return [
    {
      name: `list_${type.key}_positions`,
      description: `List all ${type.label} positions on a quote, order, or invoice`,
      annotations: { readOnlyHint: true },
      inputSchema: {
        type: "object",
        properties: { ...listProperties },
        required: ["document_type", "document_id"],
      },
    },
    {
      name: `get_${type.key}_position`,
      description: `Get a specific ${type.label} position by ID from a quote, order, or invoice`,
      annotations: { readOnlyHint: true },
      inputSchema: {
        type: "object",
        properties: { ...listProperties, ...positionIdProperty },
        required: ["document_type", "document_id", "position_id"],
      },
    },
    {
      name: `create_${type.key}_position`,
      description: `Create a ${type.label} position on a quote, order, or invoice. ${type.createHint}`,
      annotations: { destructiveHint: false },
      inputSchema: {
        type: "object",
        properties: type.noBody
          ? { ...listProperties }
          : { ...listProperties, ...positionDataProperty },
        required: type.noBody
          ? ["document_type", "document_id"]
          : ["document_type", "document_id", "position_data"],
      },
    },
    {
      name: `edit_${type.key}_position`,
      description: `Edit an existing ${type.label} position on a quote, order, or invoice`,
      annotations: { destructiveHint: false },
      inputSchema: {
        type: "object",
        properties: {
          ...listProperties,
          ...positionIdProperty,
          ...positionDataProperty,
        },
        required: [
          "document_type",
          "document_id",
          "position_id",
          "position_data",
        ],
      },
    },
    {
      name: `delete_${type.key}_position`,
      description: `Delete a ${type.label} position from a quote, order, or invoice`,
      annotations: { destructiveHint: true },
      inputSchema: {
        type: "object",
        properties: { ...listProperties, ...positionIdProperty },
        required: ["document_type", "document_id", "position_id"],
      },
    },
  ];
}

export const toolDefinitions: Tool[] =
  POSITION_TYPES.flatMap(makePositionTools);
