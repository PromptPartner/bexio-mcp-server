/**
 * Tasks tool definitions.
 * Contains MCP tool metadata for tasks domain.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const toolDefinitions: Tool[] = [
  {
    name: "list_tasks",
    description:
      "List tasks from Bexio with optional pagination and user filter",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          description: "Maximum number of tasks to return (default: 50)",
          default: 50,
        },
        offset: {
          type: "integer",
          description: "Number of tasks to skip (default: 0)",
          default: 0,
        },
        order_by: {
          type: "string",
          description: "Field to order results by (e.g., 'finish_date')",
        },
        user_id: {
          type: "integer",
          description: "Filter tasks by assigned user ID",
        },
      },
    },
  },
  {
    name: "get_task",
    description: "Get a specific task by ID",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        task_id: {
          type: "integer",
          description: "The ID of the task to retrieve",
        },
      },
      required: ["task_id"],
    },
  },
  {
    name: "create_task",
    description:
      "Create a new task with optional resource linking to a contact, invoice, quote, order, etc.",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        subject: {
          type: "string",
          description: "Task title/subject",
        },
        description: {
          type: "string",
          description: "Task description (optional)",
        },
        user_id: {
          type: "integer",
          description: "ID of the user to assign the task to",
        },
        finish_date: {
          type: "string",
          description: "Due date in ISO format (e.g., '2024-12-31')",
        },
        task_priority_id: {
          type: "integer",
          description:
            "Priority ID (use list_task_priorities to get available values)",
        },
        task_status_id: {
          type: "integer",
          description:
            "Status ID (use list_task_statuses to get available values)",
        },
        resource_type: {
          type: "string",
          enum: [
            "contact",
            "invoice",
            "quote",
            "order",
            "delivery",
            "project",
            "bill",
          ],
          description:
            "Optionally link the task to a resource (e.g., 'contact', 'invoice')",
        },
        resource_id: {
          type: "integer",
          description: "ID of the resource to link the task to",
        },
        info: {
          type: "string",
          description: "Additional information (optional)",
        },
      },
      required: ["subject", "user_id"],
    },
  },
  {
    name: "update_task",
    description: "Update an existing task",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        task_id: {
          type: "integer",
          description: "The ID of the task to update",
        },
        task_data: {
          type: "object",
          description:
            "Task fields to update, with bexio's field names (e.g., subject, info, finish_date, todo_status_id, todo_priority_id)",
        },
      },
      required: ["task_id", "task_data"],
    },
  },
  {
    name: "delete_task",
    description: "Delete a task by ID",
    annotations: { destructiveHint: true },
    inputSchema: {
      type: "object",
      properties: {
        task_id: {
          type: "integer",
          description: "The ID of the task to delete",
        },
      },
      required: ["task_id"],
    },
  },
  {
    name: "search_tasks",
    description:
      "Search tasks using multiple criteria (field, value, operator)",
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
                description:
                  "Field to search (e.g., 'subject', 'user_id', 'finish_date')",
              },
              value: {
                type: "string",
                description: "Value to search for",
              },
              criteria: {
                type: "string",
                description:
                  "Search operator ('like', '=', '>', '<', etc.)",
                default: "like",
              },
            },
            required: ["field", "value"],
          },
        },
        limit: {
          type: "integer",
          description: "Maximum number of tasks to return (default: 50)",
          default: 50,
        },
      },
      required: ["search_criteria"],
    },
  },
  {
    name: "list_task_priorities",
    description: "List all available task priority levels",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "list_task_statuses",
    description: "List all available task statuses",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];
