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
  EditOrderParamsSchema,
  DeleteOrderParamsSchema,
  GetOrderPdfParamsSchema,
  GetOrderRepetitionParamsSchema,
  EditOrderRepetitionParamsSchema,
  DeleteOrderRepetitionParamsSchema,
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
    const params = SearchOrdersParamsSchema.parse(args);
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
    return client.searchOrders(searchFilters, queryParams);
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

  edit_order: async (client, args) => {
    const { order_id, order_data } = EditOrderParamsSchema.parse(args);
    const existing = await client.getOrder(order_id) as Record<string, unknown>;
    const writable = [
      "contact_id", "contact_sub_id", "user_id", "logopaper_id",
      "language_id", "bank_account_id", "currency_id", "payment_type_id",
      "header", "footer", "title", "mwst_type", "mwst_is_net",
      "show_position_taxes", "is_valid_from",
      "delivery_address_type",
      "kb_terms_of_payment_template_id", "template_slug",
    ];
    const payload: Record<string, unknown> = {};
    for (const key of writable) {
      if (key in existing) payload[key] = existing[key];
    }
    payload.nb_decimals_amount = existing.nb_decimals_amount ?? 2;
    payload.nb_decimals_price = existing.nb_decimals_price ?? 2;
    payload.is_compact_view = existing.is_compact_view ?? false;
    Object.assign(payload, order_data);
    return client.editOrder(order_id, payload);
  },

  delete_order: async (client, args) => {
    const { order_id } = DeleteOrderParamsSchema.parse(args);
    return client.deleteOrder(order_id);
  },

  get_order_pdf: async (client, args) => {
    const { order_id } = GetOrderPdfParamsSchema.parse(args);
    return client.getOrderPdf(order_id);
  },

  get_order_repetition: async (client, args) => {
    const { order_id } = GetOrderRepetitionParamsSchema.parse(args);
    return client.getOrderRepetition(order_id);
  },

  edit_order_repetition: async (client, args) => {
    const { order_id, repetition_id, repetition_data } = EditOrderRepetitionParamsSchema.parse(args);
    return client.editOrderRepetition(order_id, repetition_id, repetition_data);
  },

  delete_order_repetition: async (client, args) => {
    const { order_id, repetition_id } = DeleteOrderRepetitionParamsSchema.parse(args);
    return client.deleteOrderRepetition(order_id, repetition_id);
  },
};
