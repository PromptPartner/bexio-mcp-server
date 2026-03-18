/**
 * Order-related Zod schemas and types.
 * Domain: Orders (kb_order)
 */

import { z } from "zod";

// Order position (line item)
const OrderPositionSchema = z
  .object({
    type: z.string(),
    text: z.string(),
    amount: z.number(),
    unit_id: z.number().int().positive().optional(),
    unit_price: z.number(),
    discount_in_percent: z.number().min(0).max(100).optional(),
    position_total: z.number().optional(),
    mwst_type: z.number().int().optional(),
    mwst_is_net: z.boolean().optional(),
    account_id: z.number().int().positive().optional(),
    tax_id: z.number().int().positive().optional(),
    tax_value: z.number().optional(),
    map_all: z.boolean().optional(),
  })
  .passthrough();

// Order creation payload
export const OrderCreateSchema = z
  .object({
    title: z.string().min(1, "Order title is required"),
    contact_id: z.number().int().positive("Contact ID must be positive"),
    delivery_address: z.string().optional(),
    delivery_address_2: z.string().optional(),
    delivery_zip: z.string().optional(),
    delivery_city: z.string().optional(),
    delivery_country_id: z.number().int().positive().optional(),
    currency_id: z.number().int().positive().optional(),
    mwst_type: z.number().int().optional(),
    mwst_is_net: z.boolean().optional(),
    show_position_taxes: z.boolean().optional(),
    is_valid_from: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      .optional(),
    is_valid_until: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
      .optional(),
    contact_address: z.string().optional(),
    contact_address_2: z.string().optional(),
    contact_zip: z.string().optional(),
    contact_city: z.string().optional(),
    contact_country_id: z.number().int().positive().optional(),
    contact_salutation_id: z.number().int().positive().optional(),
    contact_firstname: z.string().optional(),
    contact_lastname: z.string().optional(),
    contact_phone: z.string().optional(),
    contact_mobile: z.string().optional(),
    contact_email: z.string().email().optional(),
    contact_website: z.string().url().optional(),
    contact_remarks: z.string().optional(),
    user_id: z.number().int().positive().optional(),
    language_id: z.number().int().positive().optional(),
    bank_account_id: z.number().int().positive().optional(),
    payment_type_id: z.number().int().positive().optional(),
    header: z.string().optional(),
    footer: z.string().optional(),
    total: z.number().optional(),
    total_rounding_difference: z.number().optional(),
    mwst_amount: z.number().optional(),
    mwst_amount_net: z.number().optional(),
    positions: z.array(OrderPositionSchema).optional(),
  })
  .passthrough();

export type OrderCreate = z.infer<typeof OrderCreateSchema>;

// List orders
export const ListOrdersParamsSchema = z.object({
  limit: z.number().int().positive().default(50),
  offset: z.number().int().min(0).default(0),
});

export type ListOrdersParams = z.infer<typeof ListOrdersParamsSchema>;

// Get single order
export const GetOrderParamsSchema = z.object({
  order_id: z.number().int().positive(),
});

export type GetOrderParams = z.infer<typeof GetOrderParamsSchema>;

// Create order
export const CreateOrderParamsSchema = z.object({
  order_data: OrderCreateSchema,
});

export type CreateOrderParams = z.infer<typeof CreateOrderParamsSchema>;

// Search orders
export const SearchOrdersParamsSchema = z.object({
  query: z.string().optional(),
  field: z.string().optional(),
  operator: z.string().optional(),
  filters: z.array(z.object({
    field: z.string(),
    operator: z.string(),
    value: z.any(),
  })).optional(),
  limit: z.number().int().positive().optional(),
});

export type SearchOrdersParams = z.infer<typeof SearchOrdersParamsSchema>;

// Search by customer name
export const SearchOrdersByCustomerParamsSchema = z.object({
  customer_name: z.string().min(1),
  limit: z.number().int().positive().default(50),
});

export type SearchOrdersByCustomerParams = z.infer<
  typeof SearchOrdersByCustomerParamsSchema
>;

// Create invoice from order
export const CreateInvoiceFromOrderParamsSchema = z.object({
  order_id: z.number().int().positive(),
});

export type CreateInvoiceFromOrderParams = z.infer<
  typeof CreateInvoiceFromOrderParamsSchema
>;

// Create delivery from order
export const CreateDeliveryFromOrderParamsSchema = z.object({
  order_id: z.number().int().positive(),
});

export type CreateDeliveryFromOrderParams = z.infer<
  typeof CreateDeliveryFromOrderParamsSchema
>;

// Edit order
export const EditOrderParamsSchema = z.object({
  order_id: z.number().int().positive(),
  order_data: z.record(z.unknown()),
});

export type EditOrderParams = z.infer<typeof EditOrderParamsSchema>;

// Delete order
export const DeleteOrderParamsSchema = z.object({
  order_id: z.number().int().positive(),
});

export type DeleteOrderParams = z.infer<typeof DeleteOrderParamsSchema>;

// Get order PDF
export const GetOrderPdfParamsSchema = z.object({
  order_id: z.number().int().positive(),
});

export type GetOrderPdfParams = z.infer<typeof GetOrderPdfParamsSchema>;

// Get order repetition
export const GetOrderRepetitionParamsSchema = z.object({
  order_id: z.number().int().positive(),
});

export type GetOrderRepetitionParams = z.infer<typeof GetOrderRepetitionParamsSchema>;

// Edit order repetition
export const EditOrderRepetitionParamsSchema = z.object({
  order_id: z.number().int().positive(),
  repetition_id: z.number().int().positive(),
  repetition_data: z.record(z.unknown()),
});

export type EditOrderRepetitionParams = z.infer<typeof EditOrderRepetitionParamsSchema>;

// Delete order repetition
export const DeleteOrderRepetitionParamsSchema = z.object({
  order_id: z.number().int().positive(),
  repetition_id: z.number().int().positive(),
});

export type DeleteOrderRepetitionParams = z.infer<typeof DeleteOrderRepetitionParamsSchema>;
