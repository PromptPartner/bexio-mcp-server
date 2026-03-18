/**
 * Notes-related Zod schemas and types.
 * Domain: Notes (attached to contacts, invoices, quotes, orders, etc.)
 */

import { z } from "zod";

/**
 * Resource type mapping: human-readable names -> Bexio internal names.
 * Used by both notes and tasks domains for resource linking.
 */
export const RESOURCE_TYPE_MAP: Record<string, string> = {
  contact: "contact",
  invoice: "kb_invoice",
  quote: "kb_offer",
  order: "kb_order",
  delivery: "kb_delivery",
  project: "pr_project",
  bill: "kb_bill",
};

/** Enum of supported human-readable resource types */
const ResourceTypeEnum = z.enum([
  "contact",
  "invoice",
  "quote",
  "order",
  "delivery",
  "project",
  "bill",
]);

export type ResourceType = z.infer<typeof ResourceTypeEnum>;

// List notes with optional resource filter
export const ListNotesParamsSchema = z.object({
  resource_type: ResourceTypeEnum.optional(),
  resource_id: z.number().int().positive().optional(),
  limit: z.number().int().positive().default(50),
  offset: z.number().int().min(0).default(0),
}).refine(
  (data) => {
    // If resource_type is set, resource_id must also be set
    if (data.resource_type && !data.resource_id) return false;
    return true;
  },
  { message: "resource_id is required when resource_type is set" }
);

export type ListNotesParams = z.infer<typeof ListNotesParamsSchema>;

// Get single note
export const GetNoteParamsSchema = z.object({
  note_id: z.number().int().positive(),
});

export type GetNoteParams = z.infer<typeof GetNoteParamsSchema>;

// Create note — uses Bexio fields: user_id, event_start, subject
export const CreateNoteParamsSchema = z.object({
  user_id: z.number().int().positive({ message: "User ID is required" }),
  event_start: z.string().min(1, "Event start date/time is required"),
  subject: z.string().min(1, "Subject is required"),
  content: z.string().optional(),
  is_public: z.boolean().default(false),
  contact_id: z.number().int().positive().optional(),
  pr_project_id: z.number().int().positive().optional(),
});

export type CreateNoteParams = z.infer<typeof CreateNoteParamsSchema>;

// Update note
export const UpdateNoteParamsSchema = z.object({
  note_id: z.number().int().positive(),
  note_data: z.record(z.unknown()),
});

export type UpdateNoteParams = z.infer<typeof UpdateNoteParamsSchema>;

// Delete note
export const DeleteNoteParamsSchema = z.object({
  note_id: z.number().int().positive(),
});

export type DeleteNoteParams = z.infer<typeof DeleteNoteParamsSchema>;

// Search notes with optional resource filter
export const SearchNotesParamsSchema = z.object({
  query: z.string().min(1, "Query is required"),
  resource_type: ResourceTypeEnum.optional(),
  limit: z.number().int().positive().default(50),
});

export type SearchNotesParams = z.infer<typeof SearchNotesParamsSchema>;
