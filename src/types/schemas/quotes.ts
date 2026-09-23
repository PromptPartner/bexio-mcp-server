/**
 * Quote-related Zod schemas and types.
 * Domain: Quotes/Offers (kb_offer)
 */

import { z } from "zod";

// List quotes
export const ListQuotesParamsSchema = z.object({
  limit: z.number().int().positive().default(50),
  offset: z.number().int().min(0).default(0),
});

export type ListQuotesParams = z.infer<typeof ListQuotesParamsSchema>;

// Get single quote
export const GetQuoteParamsSchema = z.object({
  quote_id: z.number().int().positive(),
});

export type GetQuoteParams = z.infer<typeof GetQuoteParamsSchema>;

// Create quote
export const CreateQuoteParamsSchema = z.object({
  contact_id: z.number().int().positive(),
  user_id: z.number().int().positive(),
  quote_data: z.record(z.unknown()),
});

export type CreateQuoteParams = z.infer<typeof CreateQuoteParamsSchema>;

// Search quotes
export const SearchQuotesParamsSchema = z.object({
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

export type SearchQuotesParams = z.infer<typeof SearchQuotesParamsSchema>;

// Search by customer name
export const SearchQuotesByCustomerParamsSchema = z.object({
  customer_name: z.string().min(1),
  limit: z.number().int().positive().default(50),
});

export type SearchQuotesByCustomerParams = z.infer<
  typeof SearchQuotesByCustomerParamsSchema
>;

// Quote actions
export const IssueQuoteParamsSchema = z.object({
  quote_id: z.number().int().positive(),
});

export type IssueQuoteParams = z.infer<typeof IssueQuoteParamsSchema>;

export const AcceptQuoteParamsSchema = z.object({
  quote_id: z.number().int().positive(),
});

export type AcceptQuoteParams = z.infer<typeof AcceptQuoteParamsSchema>;

export const DeclineQuoteParamsSchema = z.object({
  quote_id: z.number().int().positive(),
});

export type DeclineQuoteParams = z.infer<typeof DeclineQuoteParamsSchema>;

export const SendQuoteParamsSchema = z.object({
  quote_id: z.number().int().positive(),
});

export type SendQuoteParams = z.infer<typeof SendQuoteParamsSchema>;

// Create order from quote
export const CreateOrderFromQuoteParamsSchema = z.object({
  quote_id: z.number().int().positive(),
});

export type CreateOrderFromQuoteParams = z.infer<
  typeof CreateOrderFromQuoteParamsSchema
>;

// Create invoice from quote
export const CreateInvoiceFromQuoteParamsSchema = z.object({
  quote_id: z.number().int().positive(),
});

export type CreateInvoiceFromQuoteParams = z.infer<
  typeof CreateInvoiceFromQuoteParamsSchema
>;

// Edit quote
export const EditQuoteParamsSchema = z.object({
  quote_id: z.number().int().positive(),
  quote_data: z.record(z.unknown()),
});

export type EditQuoteParams = z.infer<typeof EditQuoteParamsSchema>;

// Delete quote
export const DeleteQuoteParamsSchema = z.object({
  quote_id: z.number().int().positive(),
});

export type DeleteQuoteParams = z.infer<typeof DeleteQuoteParamsSchema>;

// Revert quote to draft
export const RevertQuoteParamsSchema = z.object({
  quote_id: z.number().int().positive(),
});

export type RevertQuoteParams = z.infer<typeof RevertQuoteParamsSchema>;

// Reissue quote
export const ReissueQuoteParamsSchema = z.object({
  quote_id: z.number().int().positive(),
});

export type ReissueQuoteParams = z.infer<typeof ReissueQuoteParamsSchema>;

// Mark quote as sent
export const MarkQuoteAsSentParamsSchema = z.object({
  quote_id: z.number().int().positive(),
});

export type MarkQuoteAsSentParams = z.infer<typeof MarkQuoteAsSentParamsSchema>;

// Get quote PDF
export const GetQuotePdfParamsSchema = z.object({
  quote_id: z.number().int().positive(),
});

export type GetQuotePdfParams = z.infer<typeof GetQuotePdfParamsSchema>;

// Copy quote
export const CopyQuoteParamsSchema = z.object({
  quote_id: z.number().int().positive(),
});

export type CopyQuoteParams = z.infer<typeof CopyQuoteParamsSchema>;
