/**
 * Item tool handlers.
 * Implements the logic for each item and tax tool.
 */

import { BexioClient } from "../../bexio-client.js";
import { McpError } from "../../shared/errors.js";
import {
  ListItemsParamsSchema,
  GetItemParamsSchema,
  CreateItemParamsSchema,
  ListTaxesParamsSchema,
  GetTaxParamsSchema,
} from "../../types/index.js";

export type HandlerFn = (
  client: BexioClient,
  args: unknown
) => Promise<unknown>;

export const handlers: Record<string, HandlerFn> = {
  list_items: async (client, args) => {
    const params = ListItemsParamsSchema.parse(args);
    return client.listItems(params);
  },

  get_item: async (client, args) => {
    const { item_id } = GetItemParamsSchema.parse(args);
    const item = await client.getItem(item_id);
    if (!item) {
      throw McpError.notFound("Item", item_id);
    }
    return item;
  },

  create_item: async (client, args) => {
    const { item_data } = CreateItemParamsSchema.parse(args);
    return client.createItem(item_data);
  },

  list_taxes: async (client, args) => {
    const params = ListTaxesParamsSchema.parse(args);
    return client.listTaxes(params);
  },

  get_tax: async (client, args) => {
    const { tax_id } = GetTaxParamsSchema.parse(args);
    const tax = await client.getTax(tax_id);
    if (!tax) {
      throw McpError.notFound("Tax", tax_id);
    }
    return tax;
  },
};
