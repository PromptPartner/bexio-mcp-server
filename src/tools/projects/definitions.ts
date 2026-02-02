/**
 * Projects tool definitions.
 * Contains MCP tool metadata for projects domain.
 * Includes: Projects (CRUD, archive, search), Project Types, Project Statuses
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const toolDefinitions: Tool[] = [
  // ===== PROJECTS (PROJ-01) =====
  {
    name: "list_projects",
    description: "List all projects in Bexio with pagination support",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          description: "Maximum number of projects to return (default: 100)",
          default: 100,
        },
        offset: {
          type: "integer",
          description: "Number of projects to skip (default: 0)",
          default: 0,
        },
      },
    },
  },
  {
    name: "get_project",
    description: "Get a specific project by ID from Bexio",
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "integer",
          description: "The ID of the project to retrieve",
        },
      },
      required: ["project_id"],
    },
  },
  {
    name: "create_project",
    description: "Create a new project in Bexio. Requires user_id (owner) and name.",
    inputSchema: {
      type: "object",
      properties: {
        user_id: {
          type: "integer",
          description: "The ID of the user who owns/manages the project",
        },
        name: {
          type: "string",
          description: "The name of the project",
        },
        contact_id: {
          type: "integer",
          description: "Optional: The ID of the associated contact/customer",
        },
        pr_state_id: {
          type: "integer",
          description: "Optional: The ID of the project status (use list_project_statuses to see available)",
        },
        pr_project_type_id: {
          type: "integer",
          description: "Optional: The ID of the project type (use list_project_types to see available)",
        },
        start_date: {
          type: "string",
          description: "Optional: Project start date in YYYY-MM-DD format",
        },
        end_date: {
          type: "string",
          description: "Optional: Project end date in YYYY-MM-DD format",
        },
        comment: {
          type: "string",
          description: "Optional: Additional comments/notes about the project",
        },
      },
      required: ["user_id", "name"],
    },
  },
  {
    name: "update_project",
    description: "Update an existing project in Bexio",
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "integer",
          description: "The ID of the project to update",
        },
        project_data: {
          type: "object",
          description: "Object containing the fields to update (e.g., name, contact_id, pr_state_id, etc.)",
        },
      },
      required: ["project_id", "project_data"],
    },
  },
  {
    name: "delete_project",
    description: "Delete a project from Bexio by ID. Consider using archive_project instead for data retention.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "integer",
          description: "The ID of the project to delete",
        },
      },
      required: ["project_id"],
    },
  },
  {
    name: "archive_project",
    description: "Archive a project in Bexio. Archived projects are hidden but not deleted.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "integer",
          description: "The ID of the project to archive",
        },
      },
      required: ["project_id"],
    },
  },
  {
    name: "unarchive_project",
    description: "Unarchive a previously archived project in Bexio, making it active again.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "integer",
          description: "The ID of the project to unarchive",
        },
      },
      required: ["project_id"],
    },
  },
  {
    name: "search_projects",
    description: "Search for projects in Bexio using field-based criteria. Supports exact match and partial matching.",
    inputSchema: {
      type: "object",
      properties: {
        search_criteria: {
          type: "array",
          description: "Array of search criteria objects",
          items: {
            type: "object",
            properties: {
              field: {
                type: "string",
                description: "Field name to search (e.g., 'name', 'contact_id', 'pr_state_id')",
              },
              value: {
                description: "Value to search for",
              },
              criteria: {
                type: "string",
                description: "Search operator: '=' for exact match, 'like' for partial match, '!=' for not equal",
              },
            },
            required: ["field", "value"],
          },
        },
      },
      required: ["search_criteria"],
    },
  },

  // ===== PROJECT TYPES (PROJ-02) =====
  {
    name: "list_project_types",
    description: "List all project types available in Bexio (e.g., Internal, Customer Project)",
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
    name: "get_project_type",
    description: "Get a specific project type by ID from Bexio",
    inputSchema: {
      type: "object",
      properties: {
        type_id: {
          type: "integer",
          description: "The ID of the project type to retrieve",
        },
      },
      required: ["type_id"],
    },
  },

  // ===== PROJECT STATUSES (PROJ-03) =====
  {
    name: "list_project_statuses",
    description: "List all project statuses available in Bexio (e.g., Active, Completed, On Hold)",
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
    name: "get_project_status",
    description: "Get a specific project status by ID from Bexio",
    inputSchema: {
      type: "object",
      properties: {
        status_id: {
          type: "integer",
          description: "The ID of the project status to retrieve",
        },
      },
      required: ["status_id"],
    },
  },
];
