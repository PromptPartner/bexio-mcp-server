/**
 * Response formatting utilities for MCP tool responses.
 * Maintains backward compatibility with v1 format.
 */

import { McpError } from "./errors.js";

interface McpContent {
  type: "text";
  text: string;
  [key: string]: unknown;
}

// SDK requires indexable type for responses
export interface McpResponse {
  content: McpContent[];
  isError?: boolean;
  [key: string]: unknown;
}

interface ResponseMeta {
  source: string;
  fetched_at: string;
  tool: string;
  [key: string]: unknown;
}

/** Format a successful tool response */
export function formatSuccessResponse(
  toolName: string,
  data: unknown,
  meta?: Record<string, unknown>
): McpResponse {
  const dataKey = getDataKey(toolName);
  const responseMeta: ResponseMeta = {
    source: "bexio",
    fetched_at: new Date().toISOString(),
    tool: toolName,
    ...meta,
  };

  const responseData = {
    [dataKey]: data,
    meta: responseMeta,
  };

  const completionMarker = "\n\n--- RESPONSE COMPLETE ---";

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(responseData, null, 2) + completionMarker,
      },
    ],
  };
}

/** Format an error response */
export function formatErrorResponse(error: McpError | Error): McpResponse {
  let errorData: Record<string, unknown>;

  if (error instanceof McpError) {
    errorData = error.toJSON();
  } else {
    errorData = {
      code: "INTERNAL_ERROR",
      message: error.message,
    };
  }

  const completionMarker = "\n\n--- RESPONSE COMPLETE ---";

  return {
    content: [
      {
        type: "text" as const,
        text: `Error: ${JSON.stringify(errorData, null, 2)}${completionMarker}`,
      },
    ],
    isError: true,
  };
}

/** Format a list response with pagination info */
export function formatListResponse(
  toolName: string,
  data: unknown[],
  hasMore: boolean,
  meta?: Record<string, unknown>
): McpResponse {
  return formatSuccessResponse(toolName, data, {
    count: data.length,
    has_more: hasMore,
    ...meta,
  });
}

/** Map tool names to response data keys */
export function getDataKey(toolName: string): string {
  const mapping: Record<string, string> = {
    // Contacts
    list_contacts: "contacts",
    get_contact: "contact",
    search_contacts: "contacts",
    advanced_search_contacts: "contacts",
    find_contact_by_number: "contact",
    find_contact_by_name: "contacts",
    update_contact: "contact",
    // Invoices
    list_invoices: "invoices",
    list_all_invoices: "invoices",
    get_invoice: "invoice",
    search_invoices: "invoices",
    search_invoices_by_customer: "invoices",
    create_invoice: "invoice",
    // Orders
    list_orders: "orders",
    get_order: "order",
    create_order: "order",
    search_orders: "orders",
    search_orders_by_customer: "orders",
    // Quotes
    list_quotes: "quotes",
    get_quote: "quote",
    create_quote: "quote",
    search_quotes: "quotes",
    search_quotes_by_customer: "quotes",
    // Accounting
    get_account_balances: "account_balances",
  };

  return mapping[toolName] || "data";
}
