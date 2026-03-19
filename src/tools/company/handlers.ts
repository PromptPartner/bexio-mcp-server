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
} from "../../types/index.js";

export type HandlerFn = (
  client: BexioClient,
  args: unknown
) => Promise<unknown>;

export const handlers: Record<string, HandlerFn> = {
  get_company_profile: async (client, args) => {
    GetCompanyProfileParamsSchema.parse(args);
    return client.getCompanyProfile();
  },

  update_company_profile: async (client, args) => {
    const { profile_data } = UpdateCompanyProfileParamsSchema.parse(args);
    return client.updateCompanyProfile(profile_data);
  },

  list_permissions: async (_client, args) => {
    ListPermissionsParamsSchema.parse(args);
    throw new Error(
      "The Bexio API does not provide a /permission endpoint. " +
      "Permissions are managed in the Bexio web UI under Settings > User Management."
    );
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
};
