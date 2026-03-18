/**
 * Reference data tool definitions.
 * Contains MCP tool metadata for reference data domain.
 * Includes: Contact Groups, Sectors, Salutations, Titles, Countries, Languages, Units
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const toolDefinitions: Tool[] = [
  // ===== CONTACT GROUPS (REFDATA-01) =====
  {
    name: "list_contact_groups",
    description: "List all contact groups for categorizing contacts",
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
    name: "get_contact_group",
    description: "Get a specific contact group by ID",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        group_id: {
          type: "integer",
          description: "The ID of the contact group to retrieve",
        },
      },
      required: ["group_id"],
    },
  },
  {
    name: "create_contact_group",
    description: "Create a new contact group for categorizing contacts",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The name of the contact group",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "delete_contact_group",
    description: "Delete a contact group by ID",
    annotations: { destructiveHint: true },
    inputSchema: {
      type: "object",
      properties: {
        group_id: {
          type: "integer",
          description: "The ID of the contact group to delete",
        },
      },
      required: ["group_id"],
    },
  },
  {
    name: "update_contact_group",
    description: "Update a contact group's name",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        group_id: {
          type: "integer",
          description: "The ID of the contact group to update",
        },
        name: {
          type: "string",
          description: "The new name for the contact group",
        },
      },
      required: ["group_id", "name"],
    },
  },
  {
    name: "search_contact_groups",
    description: "Search contact groups by name",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query to match against group names",
        },
        limit: {
          type: "integer",
          description: "Maximum number of results to return (default: 100)",
          default: 100,
        },
      },
      required: ["query"],
    },
  },

  // ===== CONTACT SECTORS (REFDATA-02) =====
  {
    name: "list_contact_sectors",
    description: "List all contact sectors (industry types for contacts)",
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
    name: "get_contact_sector",
    description: "Get a specific contact sector by ID",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        sector_id: {
          type: "integer",
          description: "The ID of the contact sector to retrieve",
        },
      },
      required: ["sector_id"],
    },
  },
  {
    name: "create_contact_sector",
    description: "[NOT SUPPORTED] Create a new contact sector (industry type). Note: Bexio API does not support creating contact sectors. This resource is read-only.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The name of the contact sector",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "search_contact_sectors",
    description: "Search contact sectors by name",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query to match against sector names",
        },
        limit: {
          type: "integer",
          description: "Maximum number of results to return (default: 100)",
          default: 100,
        },
      },
      required: ["query"],
    },
  },

  // ===== SALUTATIONS (REFDATA-03) =====
  {
    name: "list_salutations",
    description: "List all salutations (e.g., Mr., Mrs., Dr.)",
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
    name: "get_salutation",
    description: "Get a specific salutation by ID",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        salutation_id: {
          type: "integer",
          description: "The ID of the salutation to retrieve",
        },
      },
      required: ["salutation_id"],
    },
  },
  {
    name: "create_salutation",
    description: "Create a new salutation (e.g., Mr., Mrs., Dr.)",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The name of the salutation",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "delete_salutation",
    description: "Delete a salutation by ID",
    annotations: { destructiveHint: true },
    inputSchema: {
      type: "object",
      properties: {
        salutation_id: {
          type: "integer",
          description: "The ID of the salutation to delete",
        },
      },
      required: ["salutation_id"],
    },
  },
  {
    name: "update_salutation",
    description: "Update a salutation's name",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        salutation_id: {
          type: "integer",
          description: "The ID of the salutation to update",
        },
        name: {
          type: "string",
          description: "The new name for the salutation",
        },
      },
      required: ["salutation_id", "name"],
    },
  },
  {
    name: "search_salutations",
    description: "Search salutations by name",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query to match against salutation names",
        },
        limit: {
          type: "integer",
          description: "Maximum number of results to return (default: 100)",
          default: 100,
        },
      },
      required: ["query"],
    },
  },

  // ===== TITLES (REFDATA-04) =====
  {
    name: "list_titles",
    description: "List all titles (e.g., CEO, Manager, Director)",
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
    name: "get_title",
    description: "Get a specific title by ID",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        title_id: {
          type: "integer",
          description: "The ID of the title to retrieve",
        },
      },
      required: ["title_id"],
    },
  },
  {
    name: "create_title",
    description: "Create a new title (e.g., CEO, Manager, Director)",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The name of the title",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "delete_title",
    description: "Delete a title by ID",
    annotations: { destructiveHint: true },
    inputSchema: {
      type: "object",
      properties: {
        title_id: {
          type: "integer",
          description: "The ID of the title to delete",
        },
      },
      required: ["title_id"],
    },
  },
  {
    name: "update_title",
    description: "Update a title's name",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        title_id: {
          type: "integer",
          description: "The ID of the title to update",
        },
        name: {
          type: "string",
          description: "The new name for the title",
        },
      },
      required: ["title_id", "name"],
    },
  },
  {
    name: "search_titles",
    description: "Search titles by name",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Search query to match against title names",
        },
        limit: {
          type: "integer",
          description: "Maximum number of results to return (default: 100)",
          default: 100,
        },
      },
      required: ["query"],
    },
  },

  // ===== COUNTRIES (REFDATA-05) =====
  {
    name: "list_countries",
    description: "List all countries available in Bexio",
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
    name: "get_country",
    description: "Get a specific country by ID",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        country_id: {
          type: "integer",
          description: "The ID of the country to retrieve",
        },
      },
      required: ["country_id"],
    },
  },
  {
    name: "create_country",
    description: "Create a new country entry",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The name of the country",
        },
        name_short: {
          type: "string",
          description: "Short name of the country (e.g., 'CH', 'DE')",
        },
        iso3166_alpha2: {
          type: "string",
          description: "ISO 3166 alpha-2 country code (2 characters, e.g., 'CH', 'DE')",
        },
      },
      required: ["name", "name_short", "iso3166_alpha2"],
    },
  },
  {
    name: "delete_country",
    description: "Delete a country by ID",
    annotations: { destructiveHint: true },
    inputSchema: {
      type: "object",
      properties: {
        country_id: {
          type: "integer",
          description: "The ID of the country to delete",
        },
      },
      required: ["country_id"],
    },
  },

  // ===== LANGUAGES (REFDATA-06) =====
  {
    name: "list_languages",
    description: "List all languages available in Bexio",
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
    name: "get_language",
    description: "Get a specific language by ID",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        language_id: {
          type: "integer",
          description: "The ID of the language to retrieve",
        },
      },
      required: ["language_id"],
    },
  },
  {
    name: "create_language",
    description: "[NOT SUPPORTED] Create a new language entry. Note: Bexio API returns 501 Not Implemented for this endpoint. This resource is read-only.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The name of the language",
        },
        iso_639_1: {
          type: "string",
          description: "ISO 639-1 language code (2 characters, e.g., 'de', 'fr', 'en')",
        },
      },
      required: ["name", "iso_639_1"],
    },
  },

  // ===== UNITS (REFDATA-07) =====
  {
    name: "list_units",
    description: "List all units of measurement (e.g., hours, pieces, kg)",
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
    name: "get_unit",
    description: "Get a specific unit by ID",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        unit_id: {
          type: "integer",
          description: "The ID of the unit to retrieve",
        },
      },
      required: ["unit_id"],
    },
  },
  {
    name: "create_unit",
    description: "Create a new unit of measurement",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The name of the unit (e.g., 'hours', 'pieces', 'kg')",
        },
      },
      required: ["name"],
    },
  },
  {
    name: "delete_unit",
    description: "Delete a unit by ID",
    annotations: { destructiveHint: true },
    inputSchema: {
      type: "object",
      properties: {
        unit_id: {
          type: "integer",
          description: "The ID of the unit to delete",
        },
      },
      required: ["unit_id"],
    },
  },
];
