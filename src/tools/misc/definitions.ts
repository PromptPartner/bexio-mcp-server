/**
 * Misc tool definitions.
 * Contains MCP tool metadata for comments and contact relations.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const toolDefinitions: Tool[] = [
  // Comments (nested under document type)
  {
    name: "list_comments",
    description: "List all comments for a specific document (quote, order, invoice, or delivery)",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        document_type: {
          type: "string",
          enum: ["kb_offer", "kb_order", "kb_invoice", "kb_delivery"],
          description: "The document type (kb_offer=quote, kb_order=order, kb_invoice=invoice, kb_delivery=delivery)",
        },
        document_id: {
          type: "integer",
          description: "The ID of the document",
        },
      },
      required: ["document_type", "document_id"],
    },
  },
  {
    name: "get_comment",
    description: "Get a specific comment by ID from a document",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        document_type: {
          type: "string",
          enum: ["kb_offer", "kb_order", "kb_invoice", "kb_delivery"],
          description: "The document type (kb_offer=quote, kb_order=order, kb_invoice=invoice, kb_delivery=delivery)",
        },
        document_id: {
          type: "integer",
          description: "The ID of the document",
        },
        comment_id: {
          type: "integer",
          description: "The ID of the comment to retrieve",
        },
      },
      required: ["document_type", "document_id", "comment_id"],
    },
  },
  {
    name: "create_comment",
    description: "Create a new comment on a document",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        document_type: {
          type: "string",
          enum: ["kb_offer", "kb_order", "kb_invoice", "kb_delivery"],
          description: "The document type (kb_offer=quote, kb_order=order, kb_invoice=invoice, kb_delivery=delivery)",
        },
        document_id: {
          type: "integer",
          description: "The ID of the document",
        },
        comment_data: {
          type: "object",
          description: "Comment data to create",
        },
      },
      required: ["document_type", "document_id", "comment_data"],
    },
  },
  // Contact Relations
  {
    name: "list_contact_relations",
    description: "List contact relations with optional pagination",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          description: "Maximum number of contact relations to return (default: 50)",
          default: 50,
        },
        offset: {
          type: "integer",
          description: "Number of contact relations to skip (default: 0)",
          default: 0,
        },
      },
    },
  },
  {
    name: "get_contact_relation",
    description: "Get a specific contact relation by ID",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        relation_id: {
          type: "integer",
          description: "The ID of the contact relation to retrieve",
        },
      },
      required: ["relation_id"],
    },
  },
  {
    name: "create_contact_relation",
    description: "Create a new contact relation",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        relation_data: {
          type: "object",
          description: "Contact relation data to create",
        },
      },
      required: ["relation_data"],
    },
  },
  {
    name: "update_contact_relation",
    description: "Update a contact relation",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        relation_id: {
          type: "integer",
          description: "The ID of the contact relation to update",
        },
        relation_data: {
          type: "object",
          description: "Contact relation data to update",
        },
      },
      required: ["relation_id", "relation_data"],
    },
  },
  {
    name: "delete_contact_relation",
    description: "Delete a contact relation",
    annotations: { destructiveHint: true },
    inputSchema: {
      type: "object",
      properties: {
        relation_id: {
          type: "integer",
          description: "The ID of the contact relation to delete",
        },
      },
      required: ["relation_id"],
    },
  },
  {
    name: "search_contact_relations",
    description: "Search contact relations via the Bexio search endpoint. Use query for simple text search, or filters for advanced criteria.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Free-text value matched with LIKE" },
        field: { type: "string", description: "Field to search (default: contact_id)", default: "contact_id" },
        operator: { type: "string", description: "Comparison operator (LIKE, =, >)", default: "=" },
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
