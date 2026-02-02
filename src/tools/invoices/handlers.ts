/**
 * Invoice tool handlers.
 * Implements the logic for each invoice tool.
 */

import { BexioClient } from "../../bexio-client.js";
import { McpError } from "../../shared/errors.js";
import {
  ListInvoicesParamsSchema,
  ListAllInvoicesParamsSchema,
  GetInvoiceParamsSchema,
  SearchInvoicesParamsSchema,
  SearchInvoicesByCustomerParamsSchema,
  CreateInvoiceParamsSchema,
  IssueInvoiceParamsSchema,
  CancelInvoiceParamsSchema,
  MarkInvoiceAsSentParamsSchema,
  SendInvoiceParamsSchema,
  CopyInvoiceParamsSchema,
  ListInvoiceStatusesParamsSchema,
  ListAllStatusesParamsSchema,
  InvoiceSearchParams,
} from "../../types/index.js";

export type HandlerFn = (
  client: BexioClient,
  args: unknown
) => Promise<unknown>;

export const handlers: Record<string, HandlerFn> = {
  list_invoices: async (client, args) => {
    const params = ListInvoicesParamsSchema.parse(args);
    return client.listInvoices(params);
  },

  list_all_invoices: async (client, args) => {
    const { chunk_size } = ListAllInvoicesParamsSchema.parse(args);
    return client.listAllInvoices(chunk_size);
  },

  get_invoice: async (client, args) => {
    const { invoice_id } = GetInvoiceParamsSchema.parse(args);
    const invoice = await client.getInvoice(invoice_id);
    if (!invoice) {
      throw McpError.notFound("Invoice", invoice_id);
    }
    return invoice;
  },

  search_invoices: async (client, args) => {
    const params = SearchInvoicesParamsSchema.parse(args);
    const searchParams: InvoiceSearchParams = {
      field: params.field,
      operator: params.operator,
    };
    if (params.query !== undefined) {
      searchParams.query = params.query;
    }
    if (params.filters !== undefined) {
      searchParams.filters = params.filters.map((filter) => ({
        field: filter.field,
        operator: filter.operator,
        value: filter.value ?? null,
      }));
    }
    if (params.limit !== undefined) {
      searchParams.limit = params.limit;
    }
    return client.searchInvoices(searchParams);
  },

  search_invoices_by_customer: async (client, args) => {
    const params = SearchInvoicesByCustomerParamsSchema.parse(args);

    // Step 1: Find contacts by name
    const contacts = await client.findContactByName(params.customer_name);

    if (!contacts || contacts.length === 0) {
      return {
        invoices: [],
        message: `No contacts found with name "${params.customer_name}"`,
        contacts_found: 0,
      };
    }

    // Step 2: Search invoices for each contact (limit to first 5)
    const allInvoices: unknown[] = [];

    for (const contact of contacts.slice(0, 5)) {
      const contactId = (contact as { id?: number }).id;
      if (contactId) {
        const searchParams: InvoiceSearchParams = {
          filters: [
            {
              field: "contact_id",
              operator: "=",
              value: contactId.toString(),
            },
          ],
          limit: params.limit,
        };

        const invoices = await client.searchInvoices(searchParams);
        allInvoices.push(...(invoices as unknown[]));
      }
    }

    return {
      invoices: allInvoices,
      contacts_found: contacts.length,
      customer_name: params.customer_name,
    };
  },

  create_invoice: async (client, args) => {
    const { invoice_data } = CreateInvoiceParamsSchema.parse(args);
    return client.createInvoice(invoice_data);
  },

  issue_invoice: async (client, args) => {
    const { invoice_id } = IssueInvoiceParamsSchema.parse(args);
    return client.issueInvoice(invoice_id);
  },

  cancel_invoice: async (client, args) => {
    const { invoice_id } = CancelInvoiceParamsSchema.parse(args);
    return client.cancelInvoice(invoice_id);
  },

  mark_invoice_as_sent: async (client, args) => {
    const { invoice_id } = MarkInvoiceAsSentParamsSchema.parse(args);
    return client.markInvoiceAsSent(invoice_id);
  },

  send_invoice: async (client, args) => {
    const { invoice_id } = SendInvoiceParamsSchema.parse(args);
    return client.sendInvoice(invoice_id);
  },

  copy_invoice: async (client, args) => {
    const { invoice_id } = CopyInvoiceParamsSchema.parse(args);
    return client.copyInvoice(invoice_id);
  },

  list_invoice_statuses: async (client, args) => {
    ListInvoiceStatusesParamsSchema.parse(args);
    return client.listInvoiceStatuses();
  },

  list_all_statuses: async (client, args) => {
    const { document_type } = ListAllStatusesParamsSchema.parse(args);
    return client.listAllStatuses(document_type);
  },

  get_open_invoices: async (client) => {
    return client.getOpenInvoices();
  },

  get_overdue_invoices: async (client) => {
    return client.getOverdueInvoices();
  },
};
