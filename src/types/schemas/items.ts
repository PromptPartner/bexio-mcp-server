/**
 * Item-related Zod schemas and types.
 * Domain: Items (Articles) and Taxes
 */

import { z } from "zod";

// Item creation payload
export const ItemCreateSchema = z
  .object({
    intern_name: z.string().min(1, "Item name is required"),
    name_2: z.string().optional(),
    description: z.string().optional(),
    internal_pos: z.string().optional(),
    unit_id: z.number().int().positive().optional(),
    purchase_price: z.number().optional(),
    sale_price: z.number().optional(),
    article_type_id: z.number().int().positive().optional(),
    tax_income_id: z.number().int().positive().optional(),
    tax_id: z.number().int().positive().optional(),
    account_id: z.number().int().positive().optional(),
  })
  .passthrough();

export type ItemCreate = z.infer<typeof ItemCreateSchema>;

// List items
export const ListItemsParamsSchema = z.object({
  limit: z.number().int().positive().default(50),
  offset: z.number().int().min(0).default(0),
});

export type ListItemsParams = z.infer<typeof ListItemsParamsSchema>;

// Get single item
export const GetItemParamsSchema = z.object({
  item_id: z.number().int().positive(),
});

export type GetItemParams = z.infer<typeof GetItemParamsSchema>;

// Create item
export const CreateItemParamsSchema = z.object({
  item_data: ItemCreateSchema,
});

export type CreateItemParams = z.infer<typeof CreateItemParamsSchema>;

// Edit item
export const EditItemParamsSchema = z.object({
  item_id: z.number().int().positive(),
  item_data: z.record(z.unknown()),
});

export type EditItemParams = z.infer<typeof EditItemParamsSchema>;

// Delete item
export const DeleteItemParamsSchema = z.object({
  item_id: z.number().int().positive(),
});

export type DeleteItemParams = z.infer<typeof DeleteItemParamsSchema>;

// Search items
export const SearchItemsParamsSchema = z.object({
  query: z.string().min(1),
  limit: z.number().int().positive().default(100),
});

export type SearchItemsParams = z.infer<typeof SearchItemsParamsSchema>;

// List taxes
export const ListTaxesParamsSchema = z.object({
  limit: z.number().int().positive().default(50),
  offset: z.number().int().min(0).default(0),
});

export type ListTaxesParams = z.infer<typeof ListTaxesParamsSchema>;

// Get single tax
export const GetTaxParamsSchema = z.object({
  tax_id: z.number().int().positive(),
});

export type GetTaxParams = z.infer<typeof GetTaxParamsSchema>;
