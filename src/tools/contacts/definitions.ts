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
          description: "Contact fields to update. The street is street_name + house_number (+ address_addition); a single 'address' string is split into those.",
        },
      },
      required: ["contact_id", "contact_data"],
    },
  },
  {
    name: "create_contact",
    description:
      "Create a new contact in Bexio. Set contact_type to 'person' for individuals or 'company' for organizations.",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        contact_type: {
          type: "string",
          enum: ["person", "company"],
          description: "Type of contact: 'person' for individuals, 'company' for organizations",
        },
        name_1: {
          type: "string",
          description: "Last name (person) or company name (company)",
        },
        name_2: {
          type: "string",
          description: "First name (person) or additional name (company)",
        },
        mail: { type: "string", description: "Email address" },
        phone_fixed: { type: "string", description: "Landline phone number" },
        phone_mobile: { type: "string", description: "Mobile phone number" },
        fax: { type: "string", description: "Fax number" },
        url: { type: "string", description: "Website URL" },
        street_name: { type: "string", description: "Street name without the number, e.g. 'Bahnhofstrasse'" },
        house_number: { type: "string", description: "House number, e.g. '12a'" },
        address_addition: { type: "string", description: "Address addition, e.g. 'c/o Finance' or 'Postfach 123'" },
        address: {
          type: "string",
          description: "Deprecated: bexio has no single address field. Use street_name + house_number; if given, this is split into those two.",
        },
        postcode: { type: "string", description: "Postal code" },
        city: { type: "string", description: "City" },
        country_id: { type: "integer", description: "Country ID" },
        salutation_id: { type: "integer", description: "Salutation ID" },
        title_id: { type: "integer", description: "Title ID" },
        birthday: { type: "string", description: "Birthday (ISO date, e.g. '1990-01-15')" },
        remarks: { type: "string", description: "Notes or remarks" },
        language_id: { type: "integer", description: "Language ID" },
        contact_group_ids: {
          type: "array",
          items: { type: "integer" },
          description: "Array of contact group IDs",
        },
        sector_id: { type: "integer", description: "Sector ID" },
        user_id: { type: "integer", description: "Owner user ID" },
      },
      required: ["contact_type", "name_1"],
    },
  },
  {
    name: "delete_contact",
    description:
      "Delete a contact (soft delete -- moves to trash). Use restore_contact to recover.",
    annotations: { destructiveHint: true },
    inputSchema: {
      type: "object",
      properties: {
        contact_id: {
          type: "integer",
          description: "The ID of the contact to delete",
        },
      },
      required: ["contact_id"],
    },
  },
  {
    name: "bulk_create_contacts",
    description:
      "Create multiple contacts in one call. Returns per-item results with success/failure status.",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        contacts: {
          type: "array",
          description: "Array of contact objects to create (max 50)",
          maxItems: 50,
          items: {
            type: "object",
            properties: {
              contact_type: {
                type: "string",
                enum: ["person", "company"],
                description: "Type of contact: 'person' or 'company'",
              },
              name_1: {
                type: "string",
                description: "Last name (person) or company name (company)",
              },
              name_2: { type: "string", description: "First name or additional name" },
              mail: { type: "string", description: "Email address" },
              phone_fixed: { type: "string", description: "Landline phone number" },
              phone_mobile: { type: "string", description: "Mobile phone number" },
              fax: { type: "string", description: "Fax number" },
              url: { type: "string", description: "Website URL" },
              street_name: { type: "string", description: "Street name without the number" },
              house_number: { type: "string", description: "House number" },
              address_addition: { type: "string", description: "Address addition (c/o, Postfach)" },
              address: {
                type: "string",
                description: "Deprecated: use street_name + house_number; if given, it is split into those two.",
              },
              postcode: { type: "string", description: "Postal code" },
              city: { type: "string", description: "City" },
              country_id: { type: "integer", description: "Country ID" },
              salutation_id: { type: "integer", description: "Salutation ID" },
              title_id: { type: "integer", description: "Title ID" },
              birthday: { type: "string", description: "Birthday (ISO date)" },
              remarks: { type: "string", description: "Notes or remarks" },
              language_id: { type: "integer", description: "Language ID" },
              contact_group_ids: {
                type: "array",
                items: { type: "integer" },
                description: "Contact group IDs",
              },
              sector_id: { type: "integer", description: "Sector ID" },
              user_id: { type: "integer", description: "Owner user ID" },
            },
            required: ["contact_type", "name_1"],
          },
        },
      },
      required: ["contacts"],
    },
  },
  {
    name: "restore_contact",
    description: "Restore a previously deleted contact from trash.",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        contact_id: {
          type: "integer",
          description: "The ID of the contact to restore",
        },
      },
      required: ["contact_id"],
    },
  },
];
