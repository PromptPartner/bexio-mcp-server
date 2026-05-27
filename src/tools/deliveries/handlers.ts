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
    const params = SearchDeliveriesParamsSchema.parse(args);
    const searchFilters: Array<{ field: string; operator: string; value: unknown }> = [];

    if (params.filters) {
      if (!Array.isArray(params.filters)) {
        throw McpError.validation("filters must be a list of search expressions");
      }
      searchFilters.push(...params.filters as Array<{ field: string; operator: string; value: unknown }>);
    }

    if (params.query !== undefined) {
      const op = params.operator?.toUpperCase() ?? "LIKE";
      let value: string = params.query;
      if (op === "LIKE" && !value.includes("%")) {
        value = `%${params.query}%`;
      }
      searchFilters.push({
        field: params.field ?? "title",
        operator: op,
        value: value,
      });
    }

    if (searchFilters.length === 0) {
      throw McpError.validation("Either query or filters must be provided");
    }

    const queryParams = params.limit ? { limit: params.limit } : undefined;
    return client.searchDeliveries(searchFilters, queryParams);
  },
};
