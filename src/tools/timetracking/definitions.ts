/**
 * Time Tracking tool definitions.
 * Contains MCP tool metadata for time tracking domain.
 * Includes: Timesheets, Timesheet Statuses, Business Activities, Communication Types
 *
 * IMPORTANT: Duration format for timesheets is "HH:MM" (e.g., "02:30" for 2.5 hours).
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const toolDefinitions: Tool[] = [
  // ===== TIMESHEETS (PROJ-06) =====
  {
    name: "list_timesheets",
    description: "List all timesheet entries with pagination",
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
    name: "get_timesheet",
    description: "Get a specific timesheet entry by ID",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        timesheet_id: {
          type: "integer",
          description: "The ID of the timesheet entry to retrieve",
        },
      },
      required: ["timesheet_id"],
    },
  },
  {
    name: "create_timesheet",
    description:
      "Create a new timesheet entry. Duration must be in HH:MM format (e.g., '02:30' for 2.5 hours)",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        user_id: {
          type: "integer",
          description: "The ID of the user who worked (required)",
        },
        date: {
          type: "string",
          description: "Date of the work in YYYY-MM-DD format (will be converted to DD.MM.YYYY for Bexio) (required)",
        },
        duration: {
          type: "string",
          description:
            "Duration of work in HH:MM format, e.g., '02:30' for 2 hours 30 minutes (required)",
        },
        pr_project_id: {
          type: "integer",
          description: "ID of the project to link this timesheet to (optional)",
        },
        pr_package_id: {
          type: "integer",
          description: "ID of the work package to link this timesheet to (optional)",
        },
        pr_milestone_id: {
          type: "integer",
          description: "ID of the milestone to link this timesheet to (optional)",
        },
        client_service_id: {
          type: "integer",
          description: "ID of the business activity/service type (required — use list_business_activities to find valid IDs)",
        },
        text: {
          type: "string",
          description: "Description of the work performed (optional)",
        },
        allowable_bill: {
          type: "boolean",
          description: "Whether this time is billable (default: true)",
          default: true,
        },
      },
      required: ["user_id", "date", "duration", "client_service_id"],
    },
  },
  {
    name: "delete_timesheet",
    description: "Delete a timesheet entry by ID",
    annotations: { destructiveHint: true },
    inputSchema: {
      type: "object",
      properties: {
        timesheet_id: {
          type: "integer",
          description: "The ID of the timesheet entry to delete",
        },
      },
      required: ["timesheet_id"],
    },
  },
  {
    name: "search_timesheets",
    description:
      "Search timesheets by criteria (field, value, criteria). Common fields: user_id, pr_project_id, date",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        search_criteria: {
          type: "array",
          description:
            "Array of search criteria objects with field, value, and optional criteria properties",
          items: {
            type: "object",
            properties: {
              field: {
                type: "string",
                description: "Field name to search (e.g., user_id, pr_project_id, date)",
              },
              value: {
                description: "Value to search for",
              },
              criteria: {
                type: "string",
                description: "Comparison operator (e.g., '=', 'like', '>', '<')",
              },
            },
            required: ["field", "value"],
          },
        },
      },
      required: ["search_criteria"],
    },
  },

  // ===== TIMESHEET STATUSES (PROJ-07) =====
  {
    name: "list_timesheet_statuses",
    description: "List all timesheet statuses (e.g., open, approved, locked)",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {},
    },
  },

  // ===== BUSINESS ACTIVITIES (PROJ-08) =====
  {
    name: "list_business_activities",
    description:
      "List business activities (service types for time tracking). Used to categorize work.",
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
    name: "get_business_activity",
    description: "Get a specific business activity by ID",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        activity_id: {
          type: "integer",
          description: "The ID of the business activity to retrieve",
        },
      },
      required: ["activity_id"],
    },
  },
  {
    name: "create_business_activity",
    description: "Create a new business activity (service type for time tracking)",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "The name of the business activity",
        },
      },
      required: ["name"],
    },
  },

  // ===== COMMUNICATION TYPES (PROJ-09) =====
  {
    name: "list_communication_types",
    description: "List all communication types (e.g., email, phone, meeting)",
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
    name: "get_communication_type",
    description: "Get a specific communication type by ID",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        type_id: {
          type: "integer",
          description: "The ID of the communication type to retrieve",
        },
      },
      required: ["type_id"],
    },
  },
];
