/**
 * Delivery-related Zod schemas and types.
 * Domain: Deliveries (kb_delivery)
 */

import { z } from "zod";

// List deliveries
export const ListDeliveriesParamsSchema = z.object({
  limit: z.number().int().positive().default(50),
  offset: z.number().int().min(0).default(0),
});

export type ListDeliveriesParams = z.infer<typeof ListDeliveriesParamsSchema>;

// Get single delivery
export const GetDeliveryParamsSchema = z.object({
  delivery_id: z.number().int().positive(),
});

export type GetDeliveryParams = z.infer<typeof GetDeliveryParamsSchema>;

// Issue delivery
export const IssueDeliveryParamsSchema = z.object({
  delivery_id: z.number().int().positive(),
});

export type IssueDeliveryParams = z.infer<typeof IssueDeliveryParamsSchema>;

// Search deliveries
export const SearchDeliveriesParamsSchema = z.object({
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

export type SearchDeliveriesParams = z.infer<
  typeof SearchDeliveriesParamsSchema
>;
