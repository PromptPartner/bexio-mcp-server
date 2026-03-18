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
      "custom free-text line item. Fields: text (string), amount (number), unit_price (number), tax_id (integer)",
  },
  {
    key: "item",
    label: "item (article/product)",
    createHint:
      "article/product reference. Fields: article_id (integer), amount (number), unit_price (number), discount_in_percent (number), tax_id (integer)",
  },
  {
    key: "text",
    label: "text",
    createHint: "descriptive text block. Fields: text (string), show_pos_nr (boolean)",
  },
  {
    key: "subtotal",
    label: "subtotal",
    createHint: "running subtotal at this position in the document. No fields needed — just provide document_type and document_id",
    noBody: true,
  },
  {
    key: "discount",
    label: "discount",
    createHint:
      "discount line. Fields: text (string), is_percentual (boolean), value (number), discount_total (number)",
  },
  {
    key: "pagebreak",
    label: "pagebreak",
    createHint: "page break for PDF generation. No fields needed — just provide document_type and document_id",
    noBody: true,
  },
  {
    key: "sub",
    label: "sub (nested)",
    createHint:
      "nested sub-position group. Fields: text (string, required), show_pos_nr (boolean)",
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
