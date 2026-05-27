/**
 * Projects tool definitions.
 * Contains MCP tool metadata for projects domain.
 * Includes: Projects (CRUD, archive, search), Project Types, Project Statuses, Milestones, Work Packages
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const toolDefinitions: Tool[] = [
  // ===== PROJECTS (PROJ-01) =====
  {
    name: "list_projects",
    description: "List all projects in Bexio with pagination support",
    annotations: { readOnlyHint: true },
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
    annotations: { readOnlyHint: true },
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
    annotations: { destructiveHint: false },
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
          description: "The ID of the associated contact/customer (required by Bexio)",
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
      required: ["user_id", "name", "contact_id", "pr_state_id", "pr_project_type_id"],
    },
  },
  {
    name: "update_project",
    description: "Update an existing project in Bexio",
    annotations: { destructiveHint: false },
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
    annotations: { destructiveHint: true },
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
    annotations: { destructiveHint: false },
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
    annotations: { destructiveHint: false },
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
    annotations: { readOnlyHint: true },
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
    name: "get_project_type",
    description: "Get a specific project type by ID from Bexio",
    annotations: { readOnlyHint: true },
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
    name: "get_project_status",
    description: "Get a specific project status by ID from Bexio",
    annotations: { readOnlyHint: true },
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

  // ===== MILESTONES (PROJ-04) =====
  {
    name: "list_milestones",
    description: "List milestones for a specific project in Bexio",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "integer",
          description: "The ID of the project to list milestones for",
        },
        limit: {
          type: "integer",
          description: "Maximum number of milestones to return (default: 100)",
          default: 100,
        },
        offset: {
          type: "integer",
          description: "Number of milestones to skip (default: 0)",
          default: 0,
        },
      },
      required: ["project_id"],
    },
  },
  {
    name: "get_milestone",
    description: "Get a specific milestone by ID from a project in Bexio",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "integer",
          description: "The ID of the project containing the milestone",
        },
        milestone_id: {
          type: "integer",
          description: "The ID of the milestone to retrieve",
        },
      },
      required: ["project_id", "milestone_id"],
    },
  },
  {
    name: "create_milestone",
    description: "Create a new milestone in a project. Milestones track key deadlines and deliverables.",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "integer",
          description: "The ID of the project to add the milestone to",
        },
        name: {
          type: "string",
          description: "The name of the milestone",
        },
        end_date: {
          type: "string",
          description: "Optional: Target completion date in YYYY-MM-DD format",
        },
      },
      required: ["project_id", "name"],
    },
  },
  {
    name: "delete_milestone",
    description: "Delete a milestone from a project in Bexio",
    annotations: { destructiveHint: true },
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "integer",
          description: "The ID of the project containing the milestone",
        },
        milestone_id: {
          type: "integer",
          description: "The ID of the milestone to delete",
        },
      },
      required: ["project_id", "milestone_id"],
    },
  },

  // ===== WORK PACKAGES (PROJ-05) =====
  {
    name: "list_work_packages",
    description: "List work packages for a specific project in Bexio",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "integer",
          description: "The ID of the project to list work packages for",
        },
        limit: {
          type: "integer",
          description: "Maximum number of work packages to return (default: 100)",
          default: 100,
        },
        offset: {
          type: "integer",
          description: "Number of work packages to skip (default: 0)",
          default: 0,
        },
      },
      required: ["project_id"],
    },
  },
  {
    name: "get_work_package",
    description: "Get a specific work package by ID from a project in Bexio",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "integer",
          description: "The ID of the project containing the work package",
        },
        workpackage_id: {
          type: "integer",
          description: "The ID of the work package to retrieve",
        },
      },
      required: ["project_id", "workpackage_id"],
    },
  },
  {
    name: "create_work_package",
    description: "Create a new work package in a project. Work packages organize deliverables and track estimated effort.",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "integer",
          description: "The ID of the project to add the work package to",
        },
        name: {
          type: "string",
          description: "The name of the work package",
        },
        estimated_time: {
          type: "string",
          description: "Optional: Estimated time in HH:MM format (e.g., '02:30' for 2.5 hours)",
        },
      },
      required: ["project_id", "name"],
    },
  },
  {
    name: "update_work_package",
    description: "Update an existing work package in a project",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "integer",
          description: "The ID of the project containing the work package",
        },
        workpackage_id: {
          type: "integer",
          description: "The ID of the work package to update",
        },
        workpackage_data: {
          type: "object",
          description: "Object containing the fields to update (e.g., name, estimated_time)",
        },
      },
      required: ["project_id", "workpackage_id", "workpackage_data"],
    },
  },
  {
    name: "delete_work_package",
    description: "Delete a work package from a project in Bexio",
    annotations: { destructiveHint: true },
    inputSchema: {
      type: "object",
      properties: {
        project_id: {
          type: "integer",
          description: "The ID of the project containing the work package",
        },
        workpackage_id: {
          type: "integer",
          description: "The ID of the work package to delete",
        },
      },
      required: ["project_id", "workpackage_id"],
    },
  },
];
