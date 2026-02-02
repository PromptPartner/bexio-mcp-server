/**
 * Misc tool definitions.
 * Contains MCP tool metadata for comments and contact relations.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const toolDefinitions: Tool[] = [
  // Comments
  {
    name: "list_comments",
    description: "List all comments",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_comment",
    description: "Get a specific comment by ID",
    inputSchema: {
      type: "object",
      properties: {
        comment_id: {
          type: "integer",
          description: "The ID of the comment to retrieve",
        },
      },
      required: ["comment_id"],
    },
  },
  {
    name: "create_comment",
    description: "Create a new comment",
    inputSchema: {
      type: "object",
      properties: {
        comment_data: {
          type: "object",
          description: "Comment data to create",
        },
      },
      required: ["comment_data"],
    },
  },
  // Contact Relations
  {
    name: "list_contact_relations",
    description: "List all contact relations",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_contact_relation",
    description: "Get a specific contact relation by ID",
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
    description: "Search contact relations with filters",
    inputSchema: {
      type: "object",
      properties: {
        search_params: {
          type: "object",
          description: "Search parameters for contact relations",
        },
      },
      required: ["search_params"],
    },
  },
];
