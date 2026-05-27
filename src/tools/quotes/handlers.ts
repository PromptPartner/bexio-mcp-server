/**
 * Quote tool handlers.
 * Implements the logic for each quote tool.
 */

import { BexioClient } from "../../bexio-client.js";
import { McpError } from "../../shared/errors.js";
import {
  ListQuotesParamsSchema,
  GetQuoteParamsSchema,
  CreateQuoteParamsSchema,
  SearchQuotesParamsSchema,
  SearchQuotesByCustomerParamsSchema,
  IssueQuoteParamsSchema,
  AcceptQuoteParamsSchema,
  DeclineQuoteParamsSchema,
  SendQuoteParamsSchema,
  CreateOrderFromQuoteParamsSchema,
  CreateInvoiceFromQuoteParamsSchema,
  EditQuoteParamsSchema,
  DeleteQuoteParamsSchema,
  RevertQuoteParamsSchema,
  ReissueQuoteParamsSchema,
  MarkQuoteAsSentParamsSchema,
  GetQuotePdfParamsSchema,
  CopyQuoteParamsSchema,
} from "../../types/index.js";

export type HandlerFn = (
  client: BexioClient,
  args: unknown
) => Promise<unknown>;

export const handlers: Record<string, HandlerFn> = {
  list_quotes: async (client, args) => {
    const params = ListQuotesParamsSchema.parse(args);
    return client.listQuotes(params);
  },

  get_quote: async (client, args) => {
    const { quote_id } = GetQuoteParamsSchema.parse(args);
    const quote = await client.getQuote(quote_id);
    if (!quote) {
      throw McpError.notFound("Quote", quote_id);
    }
    return quote;
  },

  create_quote: async (client, args) => {
    const { contact_id, quote_data } = CreateQuoteParamsSchema.parse(args);
    const payload = { ...quote_data, contact_id };
    return client.createQuote(payload);
  },

  search_quotes: async (client, args) => {
    const params = SearchQuotesParamsSchema.parse(args);
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
    return client.searchQuotes(searchFilters, queryParams);
  },

  search_quotes_by_customer: async (client, args) => {
    const params = SearchQuotesByCustomerParamsSchema.parse(args);

    // Step 1: Find contacts by name
    const contacts = await client.findContactByName(params.customer_name);

    if (!contacts || contacts.length === 0) {
      return {
        quotes: [],
        message: `No contacts found with name "${params.customer_name}"`,
        contacts_found: 0,
      };
    }

    // Step 2: Search quotes for each contact (limit to first 5)
    const allQuotes: unknown[] = [];

    for (const contact of contacts.slice(0, 5)) {
      const contactId = (contact as { id?: number }).id;
      if (contactId) {
        const quotes = await client.searchQuotesByContactId(contactId);
        allQuotes.push(...(quotes as unknown[]));
      }
    }

    return {
      quotes: allQuotes,
      contacts_found: contacts.length,
      customer_name: params.customer_name,
    };
  },

  issue_quote: async (client, args) => {
    const { quote_id } = IssueQuoteParamsSchema.parse(args);
    return client.issueQuote(quote_id);
  },

  accept_quote: async (client, args) => {
    const { quote_id } = AcceptQuoteParamsSchema.parse(args);
    return client.acceptQuote(quote_id);
  },

  decline_quote: async (client, args) => {
    const { quote_id } = DeclineQuoteParamsSchema.parse(args);
    return client.declineQuote(quote_id);
  },

  send_quote: async (client, args) => {
    const { quote_id } = SendQuoteParamsSchema.parse(args);
    return client.sendQuote(quote_id);
  },

  create_order_from_quote: async (client, args) => {
    const { quote_id } = CreateOrderFromQuoteParamsSchema.parse(args);
    return client.createOrderFromQuote(quote_id);
  },

  create_invoice_from_quote: async (client, args) => {
    const { quote_id } = CreateInvoiceFromQuoteParamsSchema.parse(args);
    return client.createInvoiceFromQuote(quote_id);
  },

  edit_quote: async (client, args) => {
    const { quote_id, quote_data } = EditQuoteParamsSchema.parse(args);
    // GET existing record, then pick only writable fields + merge user changes
    const existing = await client.getQuote(quote_id) as Record<string, unknown>;
    // Whitelist: only fields Bexio accepts on PUT for kb_offer
    const writable = [
      "contact_id", "contact_sub_id", "user_id", "logopaper_id",
      "language_id", "bank_account_id", "currency_id", "payment_type_id",
      "header", "footer", "title", "mwst_type", "mwst_is_net",
      "show_position_taxes", "is_valid_from", "is_valid_until",
      "delivery_address_type",
      "kb_terms_of_payment_template_id", "template_slug",
    ];
    const payload: Record<string, unknown> = {};
    for (const key of writable) {
      if (key in existing) payload[key] = existing[key];
    }
    // Required fields that may not appear in GET response — use defaults
    payload.nb_decimals_amount = existing.nb_decimals_amount ?? 2;
    payload.nb_decimals_price = existing.nb_decimals_price ?? 2;
    payload.is_compact_view = existing.is_compact_view ?? false;
    // Apply user changes on top
    Object.assign(payload, quote_data);
    return client.editQuote(quote_id, payload);
  },

  delete_quote: async (client, args) => {
    const { quote_id } = DeleteQuoteParamsSchema.parse(args);
    return client.deleteQuote(quote_id);
  },

  revert_quote_to_draft: async (client, args) => {
    const { quote_id } = RevertQuoteParamsSchema.parse(args);
    return client.revertQuote(quote_id);
  },

  reissue_quote: async (client, args) => {
    const { quote_id } = ReissueQuoteParamsSchema.parse(args);
    return client.reissueQuote(quote_id);
  },

  mark_quote_as_sent: async (client, args) => {
    const { quote_id } = MarkQuoteAsSentParamsSchema.parse(args);
    return client.markQuoteAsSent(quote_id);
  },

  get_quote_pdf: async (client, args) => {
    const { quote_id } = GetQuotePdfParamsSchema.parse(args);
    return client.getQuotePdf(quote_id);
  },

  copy_quote: async (client, args) => {
    const { quote_id } = CopyQuoteParamsSchema.parse(args);
    return client.copyQuote(quote_id);
  },
};
