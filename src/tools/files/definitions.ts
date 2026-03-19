/**
 * Files and Additional Addresses tool definitions.
 * Contains MCP tool metadata for files domain.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const toolDefinitions: Tool[] = [
  // ===== FILES =====
  {
    name: "list_files",
    description: "List files from Bexio with optional pagination",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          description: "Maximum number of files to return (default: 50)",
          default: 50,
        },
        offset: {
          type: "integer",
          description: "Number of files to skip (default: 0)",
          default: 0,
        },
      },
    },
  },
  {
    name: "get_file",
    description: "Get a specific file's metadata by ID",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        file_id: {
          type: "integer",
          description: "The ID of the file to retrieve",
        },
      },
      required: ["file_id"],
    },
  },
  {
    name: "upload_file",
    description: "Upload a file to Bexio. File content must be provided as base64 encoded string for MCP JSON transport.",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The filename including extension (e.g., 'document.pdf')",
        },
        content_base64: {
          type: "string",
          description: "The file content encoded as base64 string",
        },
        content_type: {
          type: "string",
          description: "The MIME type of the file (e.g., 'application/pdf', 'image/png')",
        },
      },
      required: ["name", "content_base64", "content_type"],
    },
  },
  {
    name: "download_file",
    description: "Download a file's content from Bexio. Returns the file content as base64 encoded string for MCP JSON transport.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        file_id: {
          type: "integer",
          description: "The ID of the file to download",
        },
      },
      required: ["file_id"],
    },
  },
  {
    name: "update_file",
    description: "Update a file's metadata in Bexio",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        file_id: {
          type: "integer",
          description: "The ID of the file to update",
        },
        file_data: {
          type: "object",
          description: "File metadata to update (e.g., name, description)",
        },
      },
      required: ["file_id", "file_data"],
    },
  },
  {
    name: "delete_file",
    description: "Delete a file from Bexio",
    annotations: { destructiveHint: true },
    inputSchema: {
      type: "object",
      properties: {
        file_id: {
          type: "integer",
          description: "The ID of the file to delete",
        },
      },
      required: ["file_id"],
    },
  },

  // ===== ADDITIONAL ADDRESSES =====
  {
    name: "list_additional_addresses",
    description: "List additional addresses for a contact",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        contact_id: {
          type: "integer",
          description: "The ID of the contact",
        },
        limit: {
          type: "integer",
          description: "Maximum number of addresses to return (default: 50)",
          default: 50,
        },
        offset: {
          type: "integer",
          description: "Number of addresses to skip (default: 0)",
          default: 0,
        },
      },
      required: ["contact_id"],
    },
  },
  {
    name: "get_additional_address",
    description: "Get a specific additional address for a contact",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        contact_id: {
          type: "integer",
          description: "The ID of the contact",
        },
        address_id: {
          type: "integer",
          description: "The ID of the additional address",
        },
      },
      required: ["contact_id", "address_id"],
    },
  },
  {
    name: "create_additional_address",
    description: "Create an additional address for a contact",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        contact_id: {
          type: "integer",
          description: "The ID of the contact",
        },
        address_data: {
          type: "object",
          description: "The address data. Note: 'address' is a read-only computed field — use street_name + house_number instead.",
          properties: {
            name: {
              type: "string",
              description: "Name/label for the address",
            },
            street_name: {
              type: "string",
              description: "Street name (Bexio field — do NOT use 'address', it is read-only)",
            },
            house_number: {
              type: "string",
              description: "House/building number",
            },
            postcode: {
              type: "string",
              description: "Postal code",
            },
            city: {
              type: "string",
              description: "City",
            },
            country_id: {
              type: "integer",
              description: "Country ID",
            },
            subject: {
              type: "string",
              description: "Subject/purpose of the address",
            },
            description: {
              type: "string",
              description: "Additional description",
            },
          },
        },
      },
      required: ["contact_id", "address_data"],
    },
  },
  {
    name: "update_additional_address",
    description: "Update an additional address for a contact",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        contact_id: {
          type: "integer",
          description: "The ID of the contact",
        },
        address_id: {
          type: "integer",
          description: "The ID of the additional address to update",
        },
        address_data: {
          type: "object",
          description: "The address data to update",
          properties: {
            name: {
              type: "string",
              description: "Name/label for the address",
            },
            address: {
              type: "string",
              description: "Street address",
            },
            postcode: {
              type: "string",
              description: "Postal code",
            },
            city: {
              type: "string",
              description: "City",
            },
            country_id: {
              type: "integer",
              description: "Country ID",
            },
            subject: {
              type: "string",
              description: "Subject/purpose of the address",
            },
            description: {
              type: "string",
              description: "Additional description",
            },
          },
        },
      },
      required: ["contact_id", "address_id", "address_data"],
    },
  },
  {
    name: "search_additional_addresses",
    description: "Search additional addresses for a contact by criteria",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        contact_id: {
          type: "integer",
          description: "The ID of the contact",
        },
        search_criteria: {
          type: "array",
          description: "Array of search criteria objects with field, value, and criteria properties",
          items: {
            type: "object",
            properties: {
              field: { type: "string", description: "Field name to search" },
              value: { type: "string", description: "Value to search for" },
              criteria: { type: "string", description: "Search operator (e.g., 'like', '=')", default: "like" },
            },
            required: ["field", "value"],
          },
        },
        limit: {
          type: "integer",
          description: "Maximum number of results to return (default: 50)",
          default: 50,
        },
      },
      required: ["contact_id", "search_criteria"],
    },
  },
  {
    name: "delete_additional_address",
    description: "Delete an additional address from a contact",
    annotations: { destructiveHint: true },
    inputSchema: {
      type: "object",
      properties: {
        contact_id: {
          type: "integer",
          description: "The ID of the contact",
        },
        address_id: {
          type: "integer",
          description: "The ID of the additional address to delete",
        },
      },
      required: ["contact_id", "address_id"],
    },
  },
];
