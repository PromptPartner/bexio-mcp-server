/**
 * Payroll Zod schemas and types.
 * Domain: Employees, Absences, and Payroll Documents
 *
 * IMPORTANT: Payroll module is conditional - may not be enabled in all Bexio subscriptions.
 * Handlers check module availability on first call and cache the result.
 * When unavailable, tools return friendly error with upgrade instructions.
 */

import { z } from "zod";

// ===== EMPLOYEES (PAY-01) =====

export const ListEmployeesParamsSchema = z.object({
  limit: z.number().int().positive().default(50),
  offset: z.number().int().min(0).default(0),
});

export type ListEmployeesParams = z.infer<typeof ListEmployeesParamsSchema>;

export const GetEmployeeParamsSchema = z.object({
  employee_id: z.number().int().positive(),
});

export type GetEmployeeParams = z.infer<typeof GetEmployeeParamsSchema>;

export const CreateEmployeeParamsSchema = z.object({
  // Required fields
  user_id: z.number().int().positive({ message: "User ID is required" }),
  // Optional fields - Bexio may have more
  first_name: z.string().min(1).optional(),
  last_name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  hourly_rate: z.number().positive().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD").optional(),
});

export type CreateEmployeeParams = z.infer<typeof CreateEmployeeParamsSchema>;

export const UpdateEmployeeParamsSchema = z.object({
  employee_id: z.number().int().positive(),
  employee_data: z.record(z.unknown()),
});

export type UpdateEmployeeParams = z.infer<typeof UpdateEmployeeParamsSchema>;

// ===== ABSENCES (PAY-02) =====

export const ListAbsencesParamsSchema = z.object({
  year: z.number().int().positive().optional().describe("Filter by year (e.g., 2024)"),
  limit: z.number().int().positive().default(50),
  offset: z.number().int().min(0).default(0),
});

export type ListAbsencesParams = z.infer<typeof ListAbsencesParamsSchema>;

export const GetAbsenceParamsSchema = z.object({
  absence_id: z.number().int().positive(),
});

export type GetAbsenceParams = z.infer<typeof GetAbsenceParamsSchema>;

export const CreateAbsenceParamsSchema = z.object({
  // Required fields
  user_id: z.number().int().positive({ message: "User ID is required" }),
  absence_type_id: z.number().int().positive({ message: "Absence type ID is required" }),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
  // Optional fields
  half_day_start: z.boolean().default(false).describe("True if absence starts at midday"),
  half_day_end: z.boolean().default(false).describe("True if absence ends at midday"),
  note: z.string().optional(),
});

export type CreateAbsenceParams = z.infer<typeof CreateAbsenceParamsSchema>;

export const UpdateAbsenceParamsSchema = z.object({
  absence_id: z.number().int().positive(),
  absence_data: z.record(z.unknown()),
});

export type UpdateAbsenceParams = z.infer<typeof UpdateAbsenceParamsSchema>;

export const DeleteAbsenceParamsSchema = z.object({
  absence_id: z.number().int().positive(),
});

export type DeleteAbsenceParams = z.infer<typeof DeleteAbsenceParamsSchema>;

// ===== PAYROLL DOCUMENTS (PAY-03) =====

export const ListPayrollDocumentsParamsSchema = z.object({
  employee_id: z.number().int().positive().optional().describe("Filter by employee ID"),
  limit: z.number().int().positive().default(50),
  offset: z.number().int().min(0).default(0),
});

export type ListPayrollDocumentsParams = z.infer<typeof ListPayrollDocumentsParamsSchema>;
