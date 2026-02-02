/**
 * Report tool definitions.
 * Contains MCP tool metadata for reports and business intelligence domain.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const toolDefinitions: Tool[] = [
  {
    name: "get_revenue_report",
    description: "Get revenue report for a specific period",
    inputSchema: {
      type: "object",
      properties: {
        start_date: {
          type: "string",
          format: "date",
          description: "Start date for the report (YYYY-MM-DD)",
        },
        end_date: {
          type: "string",
          format: "date",
          description: "End date for the report (YYYY-MM-DD)",
        },
        group_by: {
          type: "string",
          description: "Group by field (optional)",
        },
      },
      required: ["start_date", "end_date"],
    },
  },
  {
    name: "get_customer_revenue_report",
    description: "Get customer revenue report for a specific period",
    inputSchema: {
      type: "object",
      properties: {
        start_date: {
          type: "string",
          format: "date",
          description: "Start date for the report (YYYY-MM-DD)",
        },
        end_date: {
          type: "string",
          format: "date",
          description: "End date for the report (YYYY-MM-DD)",
        },
        limit: {
          type: "integer",
          description: "Maximum number of customers to return (default: 10)",
          default: 10,
        },
      },
      required: ["start_date", "end_date"],
    },
  },
  {
    name: "get_invoice_status_report",
    description: "Get invoice status report for a specific period",
    inputSchema: {
      type: "object",
      properties: {
        start_date: {
          type: "string",
          format: "date",
          description: "Start date for the report (YYYY-MM-DD)",
        },
        end_date: {
          type: "string",
          format: "date",
          description: "End date for the report (YYYY-MM-DD)",
        },
      },
      required: ["start_date", "end_date"],
    },
  },
  {
    name: "get_overdue_invoices_report",
    description: "Get overdue invoices report",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "get_monthly_revenue_report",
    description: "Get monthly revenue report for a specific month",
    inputSchema: {
      type: "object",
      properties: {
        year: {
          type: "integer",
          description: "Year for the report",
        },
        month: {
          type: "integer",
          description: "Month for the report (1-12)",
        },
      },
      required: ["year", "month"],
    },
  },
  {
    name: "get_top_customers_by_revenue",
    description: "Get top customers by revenue",
    inputSchema: {
      type: "object",
      properties: {
        limit: {
          type: "integer",
          description: "Maximum number of customers to return (default: 10)",
          default: 10,
        },
        start_date: {
          type: "string",
          format: "date",
          description: "Start date for the report (YYYY-MM-DD)",
        },
        end_date: {
          type: "string",
          format: "date",
          description: "End date for the report (YYYY-MM-DD)",
        },
      },
    },
  },
  {
    name: "get_tasks_due_this_week",
    description: "Get all tasks due this week (invoices with due date this week)",
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
];
