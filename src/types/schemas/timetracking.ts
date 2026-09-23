/**
 * Time Tracking Zod schemas and types.
 * Domain: Time Tracking (Timesheets, Statuses, Business Activities, Communication Types)
 *
 * IMPORTANT: Duration format is "HH:MM" (e.g., "02:30" for 2.5 hours) per Bexio API requirements.
 */

import { z } from "zod";

// ===== TIMESHEETS (PROJ-06) =====

export const ListTimesheetsParamsSchema = z.object({
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
  order_by: z.string().optional(),
});

export type ListTimesheetsParams = z.infer<typeof ListTimesheetsParamsSchema>;

export const GetTimesheetParamsSchema = z.object({
  timesheet_id: z.number().int().positive(),
});

export type GetTimesheetParams = z.infer<typeof GetTimesheetParamsSchema>;

/**
 * Schema for creating a new timesheet entry.
 * Duration MUST be in HH:MM format (e.g., "02:30" for 2.5 hours).
 */
export const CreateTimesheetParamsSchema = z.object({
  // Required fields
  user_id: z.number().int().positive({ message: "User ID is required and must be positive" }),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  duration: z.string().regex(/^\d{2}:\d{2}$/, "Duration must be in HH:MM format (e.g., '02:30' for 2.5 hours)"),

  // Required: business activity
  client_service_id: z.number().int().positive({ message: "Client service ID is required" }),

  // Optional linking fields
  pr_project_id: z.number().int().positive().optional(),
  pr_package_id: z.number().int().positive().optional(),
  pr_milestone_id: z.number().int().positive().optional(),

  // Optional metadata
  text: z.string().optional(),
  allowable_bill: z.boolean().default(true),
});

export type CreateTimesheetParams = z.infer<typeof CreateTimesheetParamsSchema>;

export const DeleteTimesheetParamsSchema = z.object({
  timesheet_id: z.number().int().positive(),
});

export type DeleteTimesheetParams = z.infer<typeof DeleteTimesheetParamsSchema>;

/**
 * Search criteria for timesheets.
 * Supports field/value/criteria pattern used by Bexio search API.
 * Note: Bexio API requires value as string.
 */
export const SearchTimesheetsParamsSchema = z.object({
  search_criteria: z.array(z.object({
    field: z.string(),
    value: z.union([z.string(), z.number(), z.boolean()]).transform(v => String(v)),
    criteria: z.string().default("="),
  })).min(1, "At least one search criterion is required"),
});

export type SearchTimesheetsParams = z.infer<typeof SearchTimesheetsParamsSchema>;

export const GetProjectTimesheetsParamsSchema = z.object({
  project_id: z.number().int().positive(),
});

export type GetProjectTimesheetsParams = z.infer<typeof GetProjectTimesheetsParamsSchema>;

// ===== TIMESHEET STATUSES (PROJ-07) =====

export const ListTimesheetStatusesParamsSchema = z.object({});

export type ListTimesheetStatusesParams = z.infer<typeof ListTimesheetStatusesParamsSchema>;

// ===== BUSINESS ACTIVITIES (PROJ-08) =====

export const ListBusinessActivitiesParamsSchema = z.object({
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

export type ListBusinessActivitiesParams = z.infer<typeof ListBusinessActivitiesParamsSchema>;

export const GetBusinessActivityParamsSchema = z.object({
  activity_id: z.number().int().positive(),
});

export type GetBusinessActivityParams = z.infer<typeof GetBusinessActivityParamsSchema>;

export const CreateBusinessActivityParamsSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

export type CreateBusinessActivityParams = z.infer<typeof CreateBusinessActivityParamsSchema>;

// ===== COMMUNICATION TYPES (PROJ-09) =====

export const ListCommunicationTypesParamsSchema = z.object({
  limit: z.number().int().positive().default(100),
  offset: z.number().int().min(0).default(0),
});

export type ListCommunicationTypesParams = z.infer<typeof ListCommunicationTypesParamsSchema>;

export const GetCommunicationTypeParamsSchema = z.object({
  type_id: z.number().int().positive(),
});

export type GetCommunicationTypeParams = z.infer<typeof GetCommunicationTypeParamsSchema>;
