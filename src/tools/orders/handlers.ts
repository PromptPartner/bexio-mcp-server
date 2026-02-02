/**
 * Order tool handlers.
 * Implements the logic for each order tool.
 */

import { BexioClient } from "../../bexio-client.js";
import { McpError } from "../../shared/errors.js";
import {
  ListOrdersParamsSchema,
  GetOrderParamsSchema,
  CreateOrderParamsSchema,
  SearchOrdersParamsSchema,
  SearchOrdersByCustomerParamsSchema,
  CreateDeliveryFromOrderParamsSchema,
  CreateInvoiceFromOrderParamsSchema,
} from "../../types/index.js";

export type HandlerFn = (
  client: BexioClient,
  args: unknown
) => Promise<unknown>;

export const handlers: Record<string, HandlerFn> = {
  list_orders: async (client, args) => {
    const params = ListOrdersParamsSchema.parse(args);
    return client.listOrders(params);
  },

  get_order: async (client, args) => {
    const { order_id } = GetOrderParamsSchema.parse(args);
    const order = await client.getOrder(order_id);
    if (!order) {
      throw McpError.notFound("Order", order_id);
    }
    return order;
  },

  create_order: async (client, args) => {
    const { order_data } = CreateOrderParamsSchema.parse(args);
    return client.createOrder(order_data);
  },

  search_orders: async (client, args) => {
    const { search_params } = SearchOrdersParamsSchema.parse(args);
    return client.searchOrders(search_params);
  },

  search_orders_by_customer: async (client, args) => {
    const params = SearchOrdersByCustomerParamsSchema.parse(args);

    // Step 1: Find contacts by name
    const contacts = await client.findContactByName(params.customer_name);

    if (!contacts || contacts.length === 0) {
      return {
        orders: [],
        message: `No contacts found with name "${params.customer_name}"`,
        contacts_found: 0,
      };
    }

    // Step 2: Search orders for each contact (limit to first 5)
    const allOrders: unknown[] = [];

    for (const contact of contacts.slice(0, 5)) {
      const contactId = (contact as { id?: number }).id;
      if (contactId) {
        const orders = await client.searchOrdersByContactId(contactId);
        allOrders.push(...(orders as unknown[]));
      }
    }

    return {
      orders: allOrders,
      contacts_found: contacts.length,
      customer_name: params.customer_name,
    };
  },

  create_delivery_from_order: async (client, args) => {
    const { order_id } = CreateDeliveryFromOrderParamsSchema.parse(args);
    return client.createDeliveryFromOrder(order_id);
  },

  create_invoice_from_order: async (client, args) => {
    const { order_id } = CreateInvoiceFromOrderParamsSchema.parse(args);
    return client.createInvoiceFromOrder(order_id);
  },
};
