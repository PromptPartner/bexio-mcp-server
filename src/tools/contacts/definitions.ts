/**
 * Contact tool definitions.
 * Contains MCP tool metadata for contacts domain.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const toolDefinitions: Tool[] = [
  {
    name: "list_contacts",
    description: "List contacts from Bexio with optional pagination and filtering",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          description: "Maximum number of contacts to return (default: 50)",
          default: 50,
        },
        offset: {
          type: "integer",
          description: "Number of contacts to skip (default: 0)",
          default: 0,
        },
        search_term: {
          type: "string",
          description: "Search term to filter contacts by name, email, etc.",
        },
        contact_type_id: {
          type: "integer",
          description: "Filter by contact type ID (1=Person, 2=Company)",
        },
      },
    },
  },
  {
    name: "get_contact",
    description: "Get a specific contact by ID",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        contact_id: {
          type: "integer",
          description: "The ID of the contact to retrieve",
        },
      },
      required: ["contact_id"],
    },
  },
  {
    name: "search_contacts",
    description: "Search contacts by name, email, or other fields",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query to find contacts",
        },
        limit: {
          type: "integer",
          description: "Maximum number of contacts to return (default: 50)",
          default: 50,
        },
      },
      required: ["query"],
    },
  },
  {
    name: "advanced_search_contacts",
    description: "Perform advanced search on contacts using multiple criteria",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        search_criteria: {
          type: "array",
          description: "List of search criteria with field, value, and criteria",
          items: {
            type: "object",
            properties: {
              field: {
                type: "string",
                description: "Field to search (e.g., 'name_1', 'mail', 'city', 'nr')",
              },
              value: {
                type: "string",
                description: "Value to search for",
              },
              criteria: {
                type: "string",
                description: "Search operator ('like', '=', '>', '<', etc.)",
                default: "like",
              },
            },
            required: ["field", "value"],
          },
        },
        limit: {
          type: "integer",
          description: "Maximum number of contacts to return (default: 50)",
          default: 50,
        },
      },
      required: ["search_criteria"],
    },
  },
  {
    name: "find_contact_by_number",
    description: "Find a specific contact by its contact number (e.g., '001008')",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        contact_number: {
          type: "string",
          description: "The contact number to search for (e.g., '001008')",
        },
      },
      required: ["contact_number"],
    },
  },
  {
    name: "find_contact_by_name",
    description: "Find contacts by name (searches through all pages)",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The name to search for",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "update_contact",
    description: "Update an existing contact's information",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        contact_id: {
          type: "integer",
          description: "The ID of the contact to update",
        },
        contact_data: {
          type: "object",
          description: "Contact fields to update",
        },
      },
      required: ["contact_id", "contact_data"],
    },
  },
];
