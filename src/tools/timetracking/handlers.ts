/**
 * Time Tracking tool handlers.
 * Implements the logic for each time tracking tool.
 *
 * IMPORTANT: Duration format for timesheets is "HH:MM" (e.g., "02:30" for 2.5 hours).
 */

import { BexioClient } from "../../bexio-client.js";
import { McpError } from "../../shared/errors.js";
import {
  // Timesheets
  ListTimesheetsParamsSchema,
  GetTimesheetParamsSchema,
  CreateTimesheetParamsSchema,
  DeleteTimesheetParamsSchema,
  SearchTimesheetsParamsSchema,
  // Timesheet Statuses
  ListTimesheetStatusesParamsSchema,
  // Business Activities
  ListBusinessActivitiesParamsSchema,
  GetBusinessActivityParamsSchema,
  CreateBusinessActivityParamsSchema,
  // Communication Types
  ListCommunicationTypesParamsSchema,
  GetCommunicationTypeParamsSchema,
} from "../../types/index.js";

export type HandlerFn = (
  client: BexioClient,
  args: unknown
) => Promise<unknown>;

export const handlers: Record<string, HandlerFn> = {
  // ===== TIMESHEETS (PROJ-06) =====
  list_timesheets: async (client, args) => {
    const params = ListTimesheetsParamsSchema.parse(args);
    return client.listTimesheets(params);
  },

  get_timesheet: async (client, args) => {
    const { timesheet_id } = GetTimesheetParamsSchema.parse(args);
    const timesheet = await client.getTimesheet(timesheet_id);
    if (!timesheet) {
      throw McpError.notFound("Timesheet", timesheet_id);
    }
    return timesheet;
  },

  create_timesheet: async (client, args) => {
    const params = CreateTimesheetParamsSchema.parse(args);
    // Convert date from YYYY-MM-DD to DD.MM.YYYY format required by Bexio
    let formattedDate = params.date;
    if (/^\d{4}-\d{2}-\d{2}$/.test(params.date)) {
      const [y, m, d] = params.date.split("-");
      formattedDate = `${d}.${m}.${y}`;
    }
    return client.createTimesheet({
      user_id: params.user_id,
      client_service_id: params.client_service_id,
      tracking: {
        date: formattedDate,
        duration: params.duration,
      },
      pr_project_id: params.pr_project_id,
      pr_package_id: params.pr_package_id,
      pr_milestone_id: params.pr_milestone_id,
      text: params.text,
      allowable_bill: params.allowable_bill,
    });
  },

  delete_timesheet: async (client, args) => {
    const { timesheet_id } = DeleteTimesheetParamsSchema.parse(args);
    return client.deleteTimesheet(timesheet_id);
  },

  search_timesheets: async (client, args) => {
    const { search_criteria } = SearchTimesheetsParamsSchema.parse(args);
    return client.searchTimesheets(search_criteria);
  },

  // ===== TIMESHEET STATUSES (PROJ-07) =====
  list_timesheet_statuses: async (client, args) => {
    ListTimesheetStatusesParamsSchema.parse(args);
    return client.listTimesheetStatuses();
  },

  // ===== BUSINESS ACTIVITIES (PROJ-08) =====
  list_business_activities: async (client, args) => {
    const params = ListBusinessActivitiesParamsSchema.parse(args);
    return client.listBusinessActivities(params);
  },

  get_business_activity: async (client, args) => {
    const { activity_id } = GetBusinessActivityParamsSchema.parse(args);
    const activity = await client.getBusinessActivity(activity_id);
    if (!activity) {
      throw McpError.notFound("Business Activity", activity_id);
    }
    return activity;
  },

  create_business_activity: async (client, args) => {
    const { name } = CreateBusinessActivityParamsSchema.parse(args);
    return client.createBusinessActivity({ name });
  },

  // ===== COMMUNICATION TYPES (PROJ-09) =====
  list_communication_types: async (client, args) => {
    const params = ListCommunicationTypesParamsSchema.parse(args);
    return client.listCommunicationTypes(params);
  },

  get_communication_type: async (client, args) => {
    const { type_id } = GetCommunicationTypeParamsSchema.parse(args);
    const type = await client.getCommunicationType(type_id);
    if (!type) {
      throw McpError.notFound("Communication Type", type_id);
    }
    return type;
  },
};
