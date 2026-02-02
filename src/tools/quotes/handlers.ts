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
    const { search_params } = SearchQuotesParamsSchema.parse(args);
    return client.searchQuotes(search_params);
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
};
