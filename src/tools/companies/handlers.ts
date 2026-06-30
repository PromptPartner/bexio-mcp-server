/**
 * Multi-company (mandate) control tool handlers (v2.5.0).
 *
 * These operate on the process-wide `companyManager` rather than a single client,
 * so they ignore the `client` arg the dispatcher passes in.
 */
import { BexioClient } from "../../bexio-client.js";
import { McpError } from "../../shared/errors.js";
import { companyManager } from "../../company-manager.js";
import { SelectCompanyParamsSchema } from "../../types/index.js";

export type HandlerFn = (client: BexioClient, args: unknown) => Promise<unknown>;

export const handlers: Record<string, HandlerFn> = {
  list_companies: async () => {
    const companies = await companyManager.listCompanies();
    return { companies, active: companyManager.getActiveLabel() };
  },

  select_company: async (_client, args) => {
    const { company } = SelectCompanyParamsSchema.parse(args);
    try {
      const result = companyManager.selectCompany(company);
      return {
        ...result,
        message: `Active company is now "${result.active}". Subsequent tools operate on this company until you switch again.`,
      };
    } catch (error) {
      // Unknown label → a validation error listing the available companies.
      throw McpError.validation(error instanceof Error ? error.message : String(error));
    }
  },
};
