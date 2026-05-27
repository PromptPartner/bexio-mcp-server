/**
 * Payroll tool handlers.
 * Implements the logic for each payroll tool with module detection.
 *
 * IMPORTANT: Payroll module is conditional - not all Bexio subscriptions include it.
 * Uses probe-on-first-call pattern: attempts listEmployees(limit=1) to detect availability.
 * Result is cached for the session to avoid repeated probes.
 *
 * When module is unavailable (403/404), returns a friendly error message explaining
 * what the payroll module provides and how to enable it in Bexio settings.
 */

import { BexioClient } from "../../bexio-client.js";
import { McpError } from "../../shared/errors.js";
import {
  // Employees
  ListEmployeesParamsSchema,
  GetEmployeeParamsSchema,
  CreateEmployeeParamsSchema,
  UpdateEmployeeParamsSchema,
  // Absences
  ListAbsencesParamsSchema,
  GetAbsenceParamsSchema,
  CreateAbsenceParamsSchema,
  UpdateAbsenceParamsSchema,
  DeleteAbsenceParamsSchema,
  // Payroll Documents
  ListPayrollDocumentsParamsSchema,
} from "../../types/index.js";
import { logger } from "../../logger.js";

// ===== MODULE AVAILABILITY DETECTION =====

/**
 * Cached result of payroll module availability check.
 * null = not yet checked, true = available, false = unavailable
 */
let payrollModuleAvailable: boolean | null = null;

/**
 * Check if the Bexio Payroll module is available.
 * Uses probe-on-first-call pattern: attempts a minimal API call to detect access.
 * Result is cached for the session to avoid repeated probes.
 */
async function checkPayrollModule(client: BexioClient): Promise<boolean> {
  // Return cached result if already checked
  if (payrollModuleAvailable !== null) {
    return payrollModuleAvailable;
  }

  try {
    // Probe with a minimal request - just fetch 1 employee
    await client.listEmployees({ limit: 1, offset: 0 });
    logger.debug("Payroll module is available");
    payrollModuleAvailable = true;
    return true;
  } catch (error) {
    // Check if the error indicates the module is unavailable
    if (error instanceof McpError) {
      const status = error.statusCode;
      // 403 Forbidden or 404 Not Found typically mean module not enabled
      if (status === 403 || status === 404) {
        logger.debug("Payroll module is not available", { status });
        payrollModuleAvailable = false;
        return false;
      }
    }
    // For other errors (network, 500, etc.), don't cache - let them propagate
    throw error;
  }
}

/**
 * Create a user-friendly error for when the payroll module is not available.
 * Explains what the module provides and how to enable it.
 */
function payrollUnavailableError(): McpError {
  return new McpError(
    "BEXIO_API_ERROR",
    `Payroll module is not enabled for your Bexio account.

The Payroll module provides:
- Employee management (work contracts, hourly rates)
- Absence tracking (vacation, sick leave, etc.)
- Payroll documents (payslips, tax statements)

To enable the Payroll module:
1. Go to Bexio Settings > Subscriptions
2. Select a plan that includes Payroll features
3. Contact Bexio support if you need help choosing the right plan

Note: Payroll features are typically available in Bexio Pro and Enterprise plans.
Visit https://www.bexio.com/en/pricing for plan details.`,
    { module: "payroll", available: false }
  );
}

/**
 * Ensure payroll module is available before executing an operation.
 * Throws a friendly error if the module is not enabled.
 */
async function ensurePayrollAvailable(client: BexioClient): Promise<void> {
  const available = await checkPayrollModule(client);
  if (!available) {
    throw payrollUnavailableError();
  }
}

// ===== HANDLER TYPE =====

export type HandlerFn = (
  client: BexioClient,
  args: unknown
) => Promise<unknown>;

// ===== HANDLERS =====

export const handlers: Record<string, HandlerFn> = {
  // ===== EMPLOYEES (PAY-01) =====
  list_employees: async (client, args) => {
    await ensurePayrollAvailable(client);
    const params = ListEmployeesParamsSchema.parse(args);
    return client.listEmployees(params);
  },

  get_employee: async (client, args) => {
    await ensurePayrollAvailable(client);
    const { employee_id } = GetEmployeeParamsSchema.parse(args);
    const employee = await client.getEmployee(employee_id);
    if (!employee) {
      throw McpError.notFound("Employee", employee_id);
    }
    return employee;
  },

  create_employee: async (client, args) => {
    await ensurePayrollAvailable(client);
    const params = CreateEmployeeParamsSchema.parse(args);
    return client.createEmployee(params);
  },

  update_employee: async (client, args) => {
    await ensurePayrollAvailable(client);
    const { employee_id, employee_data } = UpdateEmployeeParamsSchema.parse(args);
    return client.updateEmployee(employee_id, employee_data);
  },

  // ===== ABSENCES (PAY-02, nested under employee in v4.0) =====
  list_absences: async (client, args) => {
    await ensurePayrollAvailable(client);
    const { employee_id, business_year, limit, offset } = ListAbsencesParamsSchema.parse(args);
    return client.listAbsences(employee_id, { businessYear: business_year, limit, offset });
  },

  get_absence: async (client, args) => {
    await ensurePayrollAvailable(client);
    const { employee_id, absence_id } = GetAbsenceParamsSchema.parse(args);
    const absence = await client.getAbsence(employee_id, absence_id);
    if (!absence) {
      throw McpError.notFound("Absence", absence_id);
    }
    return absence;
  },

  create_absence: async (client, args) => {
    await ensurePayrollAvailable(client);
    const { employee_id, ...absenceData } = CreateAbsenceParamsSchema.parse(args);
    return client.createAbsence(employee_id, absenceData);
  },

  update_absence: async (client, args) => {
    await ensurePayrollAvailable(client);
    const { employee_id, absence_id, absence_data } = UpdateAbsenceParamsSchema.parse(args);
    return client.updateAbsence(employee_id, absence_id, absence_data);
  },

  delete_absence: async (client, args) => {
    await ensurePayrollAvailable(client);
    const { employee_id, absence_id } = DeleteAbsenceParamsSchema.parse(args);
    return client.deleteAbsence(employee_id, absence_id);
  },

  // ===== PAYROLL DOCUMENTS (PAY-03) =====
  list_payroll_documents: async (client, args) => {
    await ensurePayrollAvailable(client);
    const params = ListPayrollDocumentsParamsSchema.parse(args);
    return client.listPayrollDocuments(params);
  },
};
