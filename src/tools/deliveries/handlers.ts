/**
 * Delivery tool handlers.
 * Implements the logic for each delivery tool.
 */

import { BexioClient } from "../../bexio-client.js";
import { McpError } from "../../shared/errors.js";
import {
  ListDeliveriesParamsSchema,
  GetDeliveryParamsSchema,
  IssueDeliveryParamsSchema,
  SearchDeliveriesParamsSchema,
} from "../../types/index.js";

export type HandlerFn = (
  client: BexioClient,
  args: unknown
) => Promise<unknown>;

export const handlers: Record<string, HandlerFn> = {
  list_deliveries: async (client, args) => {
    const params = ListDeliveriesParamsSchema.parse(args);
    return client.listDeliveries(params);
  },

  get_delivery: async (client, args) => {
    const { delivery_id } = GetDeliveryParamsSchema.parse(args);
    const delivery = await client.getDelivery(delivery_id);
    if (!delivery) {
      throw McpError.notFound("Delivery", delivery_id);
    }
    return delivery;
  },

  issue_delivery: async (client, args) => {
    const { delivery_id } = IssueDeliveryParamsSchema.parse(args);
    return client.issueDelivery(delivery_id);
  },

  search_deliveries: async (client, args) => {
    const { search_params } = SearchDeliveriesParamsSchema.parse(args);
    return client.searchDeliveries(search_params);
  },
};
