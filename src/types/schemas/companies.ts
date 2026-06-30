/**
 * Multi-company (mandate) control schemas (v2.5.0).
 */
import { z } from "zod";

// list_companies takes no arguments.
export const ListCompaniesParamsSchema = z.object({});
export type ListCompaniesParams = z.infer<typeof ListCompaniesParamsSchema>;

// select_company switches the active company by its configured label.
export const SelectCompanyParamsSchema = z.object({
  company: z.string().min(1),
});
export type SelectCompanyParams = z.infer<typeof SelectCompanyParamsSchema>;
