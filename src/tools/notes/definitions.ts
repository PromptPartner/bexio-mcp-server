/**
 * Notes tool definitions.
 * Contains MCP tool metadata for notes domain.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const toolDefinitions: Tool[] = [
  {
    name: "list_notes",
    description:
      "List notes from Bexio. Optionally filter by resource type and resource ID to get notes for a specific contact, invoice, quote, order, delivery, project, or bill.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        resource_type: {
          type: "string",
          enum: [
            "contact",
            "invoice",
            "quote",
            "order",
            "delivery",
            "project",
            "bill",
          ],
          description:
            "Filter by resource type (e.g., 'contact', 'invoice'). When set, resource_id is required.",
        },
        resource_id: {
          type: "integer",
          description:
            "ID of the resource to filter notes for. Required when resource_type is set.",
        },
        limit: {
          type: "integer",
          description: "Maximum number of notes to return (default: 50)",
          default: 50,
        },
        offset: {
          type: "integer",
          description: "Number of notes to skip (default: 0)",
          default: 0,
        },
      },
    },
  },
  {
    name: "get_note",
    description: "Get a specific note by ID",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        note_id: {
          type: "integer",
          description: "The ID of the note to retrieve",
        },
      },
      required: ["note_id"],
    },
  },
  {
    name: "create_note",
    description:
      "Create a new note attached to a resource (contact, invoice, quote, order, delivery, project, or bill)",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        user_id: {
          type: "integer",
          description: "ID of the user creating the note (required — use get_current_user to find your ID)",
        },
        event_start: {
          type: "string",
          description: "Start date/time of the note event in ISO format, e.g., '2025-01-15 10:00:00' (required)",
        },
        subject: {
          type: "string",
          description: "Subject/title of the note (required)",
        },
        content: {
          type: "string",
          description: "Content/body of the note (optional, sent as 'info' field)",
        },
        is_public: {
          type: "boolean",
          description: "Whether the note is publicly visible (default: false)",
          default: false,
        },
        contact_id: {
          type: "integer",
          description: "ID of the contact to link the note to (optional)",
        },
        pr_project_id: {
          type: "integer",
          description: "ID of the project to link the note to (optional)",
        },
      },
      required: ["user_id", "event_start", "subject"],
    },
  },
  {
    name: "update_note",
    description: "Update an existing note",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        note_id: {
          type: "integer",
          description: "The ID of the note to update",
        },
        note_data: {
          type: "object",
          description: "Note fields to update (e.g., title, content, is_public)",
        },
      },
      required: ["note_id", "note_data"],
    },
  },
  {
    name: "delete_note",
    description: "Delete a note by ID",
    annotations: { destructiveHint: true },
    inputSchema: {
      type: "object",
      properties: {
        note_id: {
          type: "integer",
          description: "The ID of the note to delete",
        },
      },
      required: ["note_id"],
    },
  },
  {
    name: "search_notes",
    description:
      "Search notes globally by query text. Optionally filter by resource type.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query to find notes",
        },
        resource_type: {
          type: "string",
          enum: [
            "contact",
            "invoice",
            "quote",
            "order",
            "delivery",
            "project",
            "bill",
          ],
          description: "Optionally filter results by resource type",
        },
        limit: {
          type: "integer",
          description: "Maximum number of notes to return (default: 50)",
          default: 50,
        },
      },
      required: ["query"],
    },
  },
];
