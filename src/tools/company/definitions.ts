/**
 * Company and payments config tool definitions.
 * Contains MCP tool metadata for company domain.
 * Includes: Company Profile, Permissions, Payment Types
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const toolDefinitions: Tool[] = [
  // ===== COMPANY PROFILE (REFDATA-09) =====
  {
    name: "get_company_profile",
    description: "Get the company profile including name, address, and settings",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "update_company_profile",
    description: "Update company profile settings",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        profile_data: {
          type: "object",
          description: "Profile fields to update",
        },
      },
      required: ["profile_data"],
    },
  },

  // ===== PERMISSIONS (REFDATA-10) =====
  {
    name: "list_permissions",
    description: "List all available user permissions in the Bexio account (v3.0 API)",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {},
    },
  },

  // ===== PAYMENT TYPES (REFDATA-08) =====
  {
    name: "list_payment_types",
    description: "List all payment types available for invoices and payments",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          description: "Maximum number of results to return (default: 100)",
          default: 100,
        },
        offset: {
          type: "integer",
          description: "Number of results to skip (default: 0)",
          default: 0,
        },
      },
    },
  },
  {
    name: "get_payment_type",
    description: "Get a specific payment type by ID",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        payment_type_id: {
          type: "integer",
          description: "The ID of the payment type to retrieve",
        },
      },
      required: ["payment_type_id"],
    },
  },
  {
    name: "create_payment_type",
    description: "Create a new payment type for invoices and payments",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The name of the payment type (e.g., 'Bank Transfer', 'Cash', 'Credit Card')",
        },
      },
      required: ["name"],
    },
  },
];
