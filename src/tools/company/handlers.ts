/**
 * Company and payments config tool handlers.
 * Implements the logic for each company domain tool.
 */

import { BexioClient } from "../../bexio-client.js";
import {
  GetCompanyProfileParamsSchema,
  UpdateCompanyProfileParamsSchema,
  ListPermissionsParamsSchema,
  ListPaymentTypesParamsSchema,
  GetPaymentTypeParamsSchema,
  CreatePaymentTypeParamsSchema,
  SearchPaymentTypesParamsSchema,
} from "../../types/index.js";

export type HandlerFn = (
  client: BexioClient,
  args: unknown
) => Promise<unknown>;

export const handlers: Record<string, HandlerFn> = {
  get_company_profile: async (client, args) => {
    const { profile_id } = GetCompanyProfileParamsSchema.parse(args ?? {});
    return client.getCompanyProfile(profile_id);
  },

  update_company_profile: async (client, args) => {
    const { profile_data } = UpdateCompanyProfileParamsSchema.parse(args);
    return client.updateCompanyProfile(profile_data);
  },

  list_permissions: async (client, args) => {
    ListPermissionsParamsSchema.parse(args);
    return client.listPermissions();
  },

  list_payment_types: async (client, args) => {
    const params = ListPaymentTypesParamsSchema.parse(args);
    return client.listPaymentTypes(params);
  },

  get_payment_type: async (client, args) => {
    const { payment_type_id } = GetPaymentTypeParamsSchema.parse(args);
    return client.getPaymentType(payment_type_id);
  },

  create_payment_type: async (client, args) => {
    const { name } = CreatePaymentTypeParamsSchema.parse(args);
    return client.createPaymentType({ name });
  },

  search_payment_types: async (client, args) => {
    const { query, limit } = SearchPaymentTypesParamsSchema.parse(args);
    return client.searchPaymentTypes(query, limit);
  },
};
