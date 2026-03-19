/**
 * User tool definitions.
 * Contains MCP tool metadata for users domain.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const toolDefinitions: Tool[] = [
  // ===== REAL USERS (USERS-01) =====
  {
    name: "list_users",
    description: "List all real Bexio users (actual account users, not fictional)",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          description: "Maximum number of users to return (default: 50)",
          default: 50,
        },
        offset: {
          type: "integer",
          description: "Number of users to skip (default: 0)",
          default: 0,
        },
      },
    },
  },
  {
    name: "get_user",
    description: "Get a specific real Bexio user by ID",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        user_id: {
          type: "integer",
          description: "The ID of the user to retrieve",
        },
      },
      required: ["user_id"],
    },
  },

  // ===== CURRENT USER & FICTIONAL USERS =====
  {
    name: "get_current_user",
    description: "Get the currently authenticated user",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "list_fictional_users",
    description: "List fictional users from Bexio with optional pagination",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          description: "Maximum number of users to return (default: 50)",
          default: 50,
        },
        offset: {
          type: "integer",
          description: "Number of users to skip (default: 0)",
          default: 0,
        },
      },
    },
  },
  {
    name: "get_fictional_user",
    description: "Get a specific fictional user by ID",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        user_id: {
          type: "integer",
          description: "The ID of the user to retrieve",
        },
      },
      required: ["user_id"],
    },
  },
  {
    name: "create_fictional_user",
    description: "Create a new fictional user. Requires salutation_type, firstname, lastname, and email.",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        user_data: {
          type: "object",
          description: "User data to create. Must include: salutation_type (mr/mrs), firstname, lastname, email",
          properties: {
            salutation_type: { type: "string", description: "Salutation: 'mr' or 'mrs'" },
            firstname: { type: "string", description: "First name" },
            lastname: { type: "string", description: "Last name" },
            email: { type: "string", description: "Email address (required by Bexio)" },
          },
          required: ["salutation_type", "firstname", "lastname", "email"],
        },
      },
      required: ["user_data"],
    },
  },
  {
    name: "update_fictional_user",
    description: "Update a fictional user",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        user_id: {
          type: "integer",
          description: "The ID of the user to update",
        },
        user_data: {
          type: "object",
          description: "User data to update",
        },
      },
      required: ["user_id", "user_data"],
    },
  },
  {
    name: "delete_fictional_user",
    description: "Delete a fictional user",
    annotations: { destructiveHint: true },
    inputSchema: {
      type: "object",
      properties: {
        user_id: {
          type: "integer",
          description: "The ID of the user to delete",
        },
      },
      required: ["user_id"],
    },
  },
];
