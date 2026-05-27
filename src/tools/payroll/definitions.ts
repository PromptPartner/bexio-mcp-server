/**
 * Payroll tool definitions.
 * Contains MCP tool metadata for payroll domain.
 *
 * IMPORTANT: Payroll module requires a Bexio subscription with payroll features.
 * All tools check module availability on first call and cache the result.
 * When unavailable, tools return a friendly error explaining how to enable payroll.
 *
 * 10 tools total:
 * - Employees: 4 tools (list, get, create, update)
 * - Absences: 5 tools (list, get, create, update, delete)
 * - Payroll Documents: 1 tool (list)
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const toolDefinitions: Tool[] = [
  // ===== EMPLOYEES (PAY-01) =====
  {
    name: "list_employees",
    description: "List employees in the payroll system. Requires Bexio Payroll module subscription. Use to get employee IDs for timesheets and absences.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          description: "Maximum number of results to return (default: 50)",
          default: 50,
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
    name: "get_employee",
    description: "Get a specific employee by ID. Requires Bexio Payroll module subscription.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        employee_id: {
          type: "string",
          description: "The UUID of the employee to retrieve",
        },
      },
      required: ["employee_id"],
    },
  },
  {
    name: "create_employee",
    description: "Create a new employee in the payroll system. Requires Bexio Payroll module subscription. Links a Bexio user to payroll.",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        user_id: {
          type: "integer",
          description: "The ID of the Bexio user to create as an employee",
        },
        first_name: {
          type: "string",
          description: "Employee's first name",
        },
        last_name: {
          type: "string",
          description: "Employee's last name",
        },
        email: {
          type: "string",
          description: "Employee's email address",
        },
        hourly_rate: {
          type: "number",
          description: "Hourly rate for the employee",
        },
        start_date: {
          type: "string",
          description: "Employment start date in YYYY-MM-DD format",
        },
        end_date: {
          type: "string",
          description: "Employment end date in YYYY-MM-DD format (for terminations)",
        },
      },
      required: ["user_id"],
    },
  },
  {
    name: "update_employee",
    description: "Update an existing employee. Requires Bexio Payroll module subscription.",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        employee_id: {
          type: "string",
          description: "The UUID of the employee to update",
        },
        employee_data: {
          type: "object",
          description: "The data to update on the employee (e.g., hourly_rate, end_date)",
        },
      },
      required: ["employee_id", "employee_data"],
    },
  },

  // ===== ABSENCES (PAY-02) =====
  {
    name: "list_absences",
    description: "List a specific employee's absences (vacation, sick leave, etc.). Requires Bexio Payroll module subscription. Optional year filter.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        employee_id: {
          type: "string",
          description: "The UUID of the employee whose absences to list (use list_employees to find)",
        },
        business_year: {
          type: "integer",
          description: "Business year (required by Bexio, e.g. 2025)",
        },
        limit: {
          type: "integer",
          description: "Maximum number of results to return (default: 50)",
          default: 50,
        },
        offset: {
          type: "integer",
          description: "Number of results to skip (default: 0)",
          default: 0,
        },
      },
      required: ["employee_id", "business_year"],
    },
  },
  {
    name: "get_absence",
    description: "Get a specific absence record by ID. Requires Bexio Payroll module subscription.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        employee_id: {
          type: "string",
          description: "The employee the absence belongs to (use list_employees to find)",
        },
        absence_id: {
          type: "string",
          description: "The ID of the absence to retrieve",
        },
      },
      required: ["employee_id", "absence_id"],
    },
  },
  {
    name: "create_absence",
    description: "Create a new absence record (vacation, sick leave, etc.). Requires Bexio Payroll module subscription.",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        employee_id: {
          type: "string",
          description: "The employee this absence is for (use list_employees to find)",
        },
        absence_type_id: {
          type: "integer",
          description: "The type of absence (vacation, sick, etc.) - use list_absences to find types",
        },
        start_date: {
          type: "string",
          description: "Absence start date in YYYY-MM-DD format",
        },
        end_date: {
          type: "string",
          description: "Absence end date in YYYY-MM-DD format",
        },
        half_day_start: {
          type: "boolean",
          description: "True if absence starts at midday (default: false)",
          default: false,
        },
        half_day_end: {
          type: "boolean",
          description: "True if absence ends at midday (default: false)",
          default: false,
        },
        note: {
          type: "string",
          description: "Optional note for this absence",
        },
      },
      required: ["employee_id", "absence_type_id", "start_date", "end_date"],
    },
  },
  {
    name: "update_absence",
    description: "Update an existing absence record. Requires Bexio Payroll module subscription.",
    annotations: { destructiveHint: false },
    inputSchema: {
      type: "object",
      properties: {
        employee_id: {
          type: "string",
          description: "The employee the absence belongs to (use list_employees to find)",
        },
        absence_id: {
          type: "string",
          description: "The ID of the absence to update",
        },
        absence_data: {
          type: "object",
          description: "The data to update (e.g., end_date, note)",
        },
      },
      required: ["employee_id", "absence_id", "absence_data"],
    },
  },
  {
    name: "delete_absence",
    description: "Delete an absence record. Requires Bexio Payroll module subscription.",
    annotations: { destructiveHint: true },
    inputSchema: {
      type: "object",
      properties: {
        employee_id: {
          type: "string",
          description: "The employee the absence belongs to (use list_employees to find)",
        },
        absence_id: {
          type: "string",
          description: "The ID of the absence to delete",
        },
      },
      required: ["employee_id", "absence_id"],
    },
  },

  // ===== PAYROLL DOCUMENTS (PAY-03) =====
  {
    name: "list_payroll_documents",
    description: "List payroll documents (payslips, etc.). Requires Bexio Payroll module subscription. Optional employee filter.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {
        employee_id: {
          type: "string",
          description: "Filter by employee ID to see only their documents",
        },
        limit: {
          type: "integer",
          description: "Maximum number of results to return (default: 50)",
          default: 50,
        },
        offset: {
          type: "integer",
          description: "Number of results to skip (default: 0)",
          default: 0,
        },
      },
    },
  },
];
