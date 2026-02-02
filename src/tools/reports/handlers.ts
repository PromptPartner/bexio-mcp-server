/**
 * Report tool handlers.
 * Implements the logic for each report and business intelligence tool.
 */

import { BexioClient } from "../../bexio-client.js";
import {
  GetRevenueReportParamsSchema,
  GetCustomerRevenueReportParamsSchema,
  GetInvoiceStatusReportParamsSchema,
  GetMonthlyRevenueReportParamsSchema,
  GetTopCustomersByRevenueParamsSchema,
} from "../../types/index.js";

export type HandlerFn = (
  client: BexioClient,
  args: unknown
) => Promise<unknown>;

export const handlers: Record<string, HandlerFn> = {
  get_revenue_report: async (client, args) => {
    const { start_date, end_date, group_by } =
      GetRevenueReportParamsSchema.parse(args);
    return client.getRevenueReport(start_date, end_date, group_by);
  },

  get_customer_revenue_report: async (client, args) => {
    const { start_date, end_date, limit } =
      GetCustomerRevenueReportParamsSchema.parse(args);
    return client.getCustomerRevenueReport(start_date, end_date, limit);
  },

  get_invoice_status_report: async (client, args) => {
    const { start_date, end_date } = GetInvoiceStatusReportParamsSchema.parse(args);
    return client.getInvoiceStatusReport(start_date, end_date);
  },

  get_overdue_invoices_report: async (client) => {
    return client.getOverdueInvoicesReport();
  },

  get_monthly_revenue_report: async (client, args) => {
    const { year, month } = GetMonthlyRevenueReportParamsSchema.parse(args);
    return client.getMonthlyRevenueReport(year, month);
  },

  get_top_customers_by_revenue: async (client, args) => {
    const { limit, start_date, end_date } =
      GetTopCustomersByRevenueParamsSchema.parse(args);
    return client.getTopCustomersByRevenue(limit, start_date, end_date);
  },

  get_tasks_due_this_week: async (client) => {
    return client.getTasksDueThisWeek();
  },
};
