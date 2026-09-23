/**
 * Common types shared across all domains.
 * Keep this file under 50 lines.
 */

import { z } from "zod";

// Configuration
export interface BexioConfig {
  baseUrl: string;
  /** Static token (Personal Access Token). Either this or getToken is required. */
  apiToken?: string;
  /** Resolves a current access token per request (OAuth connections). */
  getToken?: () => Promise<string>;
  /** Called once on HTTP 401 before the request is retried. */
  onUnauthorized?: () => Promise<void>;
}

// Pagination
export interface PaginationParams {
  limit?: number;
  offset?: number;
}

// API Response wrapper
export interface BexioApiResponse<T = unknown> {
  data?: T;
  error?: string;
  message?: string;
}

// Search criteria for advanced searches
export const SearchCriteriaSchema = z.object({
  field: z.string().min(1, "Field is required"),
  value: z.string().min(1, "Value is required"),
  criteria: z.string().default("like"),
});

export type SearchCriteria = z.infer<typeof SearchCriteriaSchema>;
