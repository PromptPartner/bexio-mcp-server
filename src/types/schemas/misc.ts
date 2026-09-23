/**
 * Misc-related Zod schemas and types.
 * Domain: Comments and Contact Relations
 */

import { z } from "zod";

// List contact relations with pagination
export const ListContactRelationsParamsSchema = z.object({
  limit: z.number().int().positive().default(50),
  offset: z.number().int().min(0).default(0),
});

export type ListContactRelationsParams = z.infer<typeof ListContactRelationsParamsSchema>;

// ===== COMMENTS =====
// Comments are nested under document types: kb_offer, kb_order, kb_invoice, kb_delivery

// List comments
export const ListCommentsParamsSchema = z.object({
  document_type: z.enum(["kb_offer", "kb_order", "kb_invoice", "kb_delivery"]),
  document_id: z.number().int().positive(),
});

export type ListCommentsParams = z.infer<typeof ListCommentsParamsSchema>;

// Get comment
export const GetCommentParamsSchema = z.object({
  document_type: z.enum(["kb_offer", "kb_order", "kb_invoice", "kb_delivery"]),
  document_id: z.number().int().positive(),
  comment_id: z.number().int().positive(),
});

export type GetCommentParams = z.infer<typeof GetCommentParamsSchema>;

// Create comment
export const CreateCommentParamsSchema = z.object({
  document_type: z.enum(["kb_offer", "kb_order", "kb_invoice", "kb_delivery"]),
  document_id: z.number().int().positive(),
  comment_data: z.record(z.unknown()),
});

export type CreateCommentParams = z.infer<typeof CreateCommentParamsSchema>;

// ===== CONTACT RELATIONS =====

// Get contact relation
export const GetContactRelationParamsSchema = z.object({
  relation_id: z.number().int().positive(),
});

export type GetContactRelationParams = z.infer<
  typeof GetContactRelationParamsSchema
>;

// Create contact relation
export const CreateContactRelationParamsSchema = z.object({
  relation_data: z.record(z.unknown()),
});

export type CreateContactRelationParams = z.infer<
  typeof CreateContactRelationParamsSchema
>;

// Update contact relation
export const UpdateContactRelationParamsSchema = z.object({
  relation_id: z.number().int().positive(),
  relation_data: z.record(z.unknown()),
});

export type UpdateContactRelationParams = z.infer<
  typeof UpdateContactRelationParamsSchema
>;

// Delete contact relation
export const DeleteContactRelationParamsSchema = z.object({
  relation_id: z.number().int().positive(),
});

export type DeleteContactRelationParams = z.infer<
  typeof DeleteContactRelationParamsSchema
>;

// Search contact relations
export const SearchContactRelationsParamsSchema = z.object({
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

export type SearchContactRelationsParams = z.infer<
  typeof SearchContactRelationsParamsSchema
>;
