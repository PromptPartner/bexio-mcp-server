/**
 * Bexio API Client.
 * Handles all HTTP communication with the Bexio API.
 * Uses logger for all output (no console.log).
 */

import axios, { AxiosInstance, AxiosResponse } from "axios";
import { logger } from "./logger.js";
import { McpError } from "./shared/errors.js";
import {
  BexioConfig,
  PaginationParams,
  ContactSearchParams,
  InvoiceSearchParams,
  InvoiceCreate,
  OrderCreate,
  SearchCriteria,
} from "./types/index.js";

export class BexioClient {
  private client: AxiosInstance;
  private config: BexioConfig;

  constructor(config: BexioConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseUrl,
      headers: {
        Authorization: `Bearer ${config.apiToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      timeout: 30000,
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response) {
          const status = error.response.status;
          const message =
            error.response.data?.message || error.response.statusText;
          throw McpError.bexioApi(message, status, {
            url: error.config?.url,
            method: error.config?.method,
            ...(error.response.data?.errors && { validationErrors: error.response.data.errors }),
            ...(error.response.data?.error_code && { errorCode: error.response.data.error_code }),
          });
        } else if (error.request) {
          throw McpError.bexioApi("No response received from server", undefined, {
            error: "NETWORK_ERROR",
          });
        } else {
          throw McpError.internal(error.message);
        }
      }
    );
  }

  private async makeRequest<T = unknown>(
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    endpoint: string,
    params?: Record<string, unknown> | PaginationParams,
    data?: unknown
  ): Promise<T> {
    logger.debug(`${method} ${endpoint}`, { params, hasData: !!data });
    const config: Record<string, unknown> = { method, url: endpoint, params };
    if (data !== undefined) config.data = data;
    const response: AxiosResponse<T> = await this.client.request(config as Parameters<typeof this.client.request>[0]);
    return response.data;
  }

  /**
   * Make a request to a non-default API version (e.g. 3.0, 4.0).
   * Bypasses the v2.0 baseURL by constructing the full URL directly.
   */
  private async makeVersionedRequest<T = unknown>(
    version: string,
    method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
    endpoint: string,
    params?: Record<string, unknown> | PaginationParams,
    data?: unknown
  ): Promise<T> {
    const url = `https://api.bexio.com/${version}/${endpoint}`;
    logger.debug(`${method} ${url}`, { params, hasData: !!data });
    try {
      const response: AxiosResponse<T> = await axios.request({
        method,
        url,
        headers: {
          Authorization: `Bearer ${this.config.apiToken}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        params,
        data,
      });
      return response.data;
    } catch (error: unknown) {
      if (axios.isAxiosError(error) && error.response) {
        const status = error.response.status;
        const message =
          error.response.data?.message || error.response.statusText;
        throw McpError.bexioApi(message, status, {
          url,
          method,
          ...(error.response.data?.errors && { validationErrors: error.response.data.errors }),
          ...(error.response.data?.error_code && { errorCode: error.response.data.error_code }),
        });
      } else if (axios.isAxiosError(error) && error.request) {
        throw McpError.bexioApi("No response received from server", undefined, {
          error: "NETWORK_ERROR",
        });
      } else {
        throw McpError.internal(error instanceof Error ? error.message : String(error));
      }
    }
  }

  // ===== CONTACT GROUPS =====
  async listContactGroups(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeRequest("GET", "/contact_group", params);
  }

  async getContactGroup(groupId: number): Promise<unknown> {
    return this.makeRequest("GET", `/contact_group/${groupId}`);
  }

  async createContactGroup(data: { name: string }): Promise<unknown> {
    return this.makeRequest("POST", "/contact_group", undefined, data);
  }

  async deleteContactGroup(groupId: number): Promise<unknown> {
    return this.makeRequest("DELETE", `/contact_group/${groupId}`);
  }

  async updateContactGroup(groupId: number, data: { name: string }): Promise<unknown> {
    return this.makeRequest("PUT", `/contact_group/${groupId}`, undefined, data);
  }

  async searchContactGroups(query: string, limit = 100): Promise<unknown[]> {
    const criteria: SearchCriteria[] = [{ field: "name", value: query, criteria: "like" }];
    return this.makeRequest("POST", "/contact_group/search", { limit }, criteria);
  }

  // ===== CONTACT SECTORS (API uses "contact_branch") =====
  async listContactSectors(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeRequest("GET", "/contact_branch", params);
  }

  async getContactSector(sectorId: number): Promise<unknown> {
    return this.makeRequest("GET", `/contact_branch/${sectorId}`);
  }

  async createContactSector(data: { name: string }): Promise<unknown> {
    return this.makeRequest("POST", "/contact_branch", undefined, data);
  }

  async searchContactSectors(query: string, limit = 100): Promise<unknown[]> {
    const criteria: SearchCriteria[] = [{ field: "name", value: query, criteria: "like" }];
    return this.makeRequest("POST", "/contact_branch/search", { limit }, criteria);
  }

  // ===== SALUTATIONS =====
  async listSalutations(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeRequest("GET", "/salutation", params);
  }

  async getSalutation(salutationId: number): Promise<unknown> {
    return this.makeRequest("GET", `/salutation/${salutationId}`);
  }

  async createSalutation(data: { name: string }): Promise<unknown> {
    return this.makeRequest("POST", "/salutation", undefined, data);
  }

  async deleteSalutation(salutationId: number): Promise<unknown> {
    return this.makeRequest("DELETE", `/salutation/${salutationId}`);
  }

  async updateSalutation(salutationId: number, data: { name: string }): Promise<unknown> {
    return this.makeRequest("PUT", `/salutation/${salutationId}`, undefined, data);
  }

  async searchSalutations(query: string, limit = 100): Promise<unknown[]> {
    const criteria: SearchCriteria[] = [{ field: "name", value: query, criteria: "like" }];
    return this.makeRequest("POST", "/salutation/search", { limit }, criteria);
  }

  // ===== TITLES =====
  async listTitles(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeRequest("GET", "/title", params);
  }

  async getTitle(titleId: number): Promise<unknown> {
    return this.makeRequest("GET", `/title/${titleId}`);
  }

  async createTitle(data: { name: string }): Promise<unknown> {
    return this.makeRequest("POST", "/title", undefined, data);
  }

  async deleteTitle(titleId: number): Promise<unknown> {
    return this.makeRequest("DELETE", `/title/${titleId}`);
  }

  async updateTitle(titleId: number, data: { name: string }): Promise<unknown> {
    return this.makeRequest("PUT", `/title/${titleId}`, undefined, data);
  }

  async searchTitles(query: string, limit = 100): Promise<unknown[]> {
    const criteria: SearchCriteria[] = [{ field: "name", value: query, criteria: "like" }];
    return this.makeRequest("POST", "/title/search", { limit }, criteria);
  }

  // ===== COUNTRIES =====
  async listCountries(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeRequest("GET", "/country", params);
  }

  async getCountry(countryId: number): Promise<unknown> {
    return this.makeRequest("GET", `/country/${countryId}`);
  }

  async createCountry(data: { name: string; name_short: string; iso3166_alpha2: string }): Promise<unknown> {
    return this.makeRequest("POST", "/country", undefined, data);
  }

  async deleteCountry(countryId: number): Promise<unknown> {
    return this.makeRequest("DELETE", `/country/${countryId}`);
  }

  // ===== LANGUAGES =====
  async listLanguages(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeRequest("GET", "/language", params);
  }

  async getLanguage(languageId: number): Promise<unknown> {
    return this.makeRequest("GET", `/language/${languageId}`);
  }

  async createLanguage(data: { name: string; iso_639_1: string }): Promise<unknown> {
    return this.makeRequest("POST", "/language", undefined, data);
  }

  // ===== UNITS =====
  async listUnits(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeRequest("GET", "/unit", params);
  }

  async getUnit(unitId: number): Promise<unknown> {
    return this.makeRequest("GET", `/unit/${unitId}`);
  }

  async createUnit(data: { name: string }): Promise<unknown> {
    return this.makeRequest("POST", "/unit", undefined, data);
  }

  async deleteUnit(unitId: number): Promise<unknown> {
    return this.makeRequest("DELETE", `/unit/${unitId}`);
  }

  // ===== COMPANY PROFILE =====
  async getCompanyProfile(): Promise<unknown> {
    return this.makeRequest("GET", "/company_profile");
  }

  async updateCompanyProfile(data: Record<string, unknown>): Promise<unknown> {
    return this.makeRequest("POST", "/company_profile", undefined, data);
  }

  // ===== PERMISSIONS =====
  async listPermissions(): Promise<unknown> {
    return this.makeRequest("GET", "/permission");
  }

  // ===== PAYMENT TYPES =====
  async listPaymentTypes(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeRequest("GET", "/payment_type", params);
  }

  async getPaymentType(paymentTypeId: number): Promise<unknown> {
    return this.makeRequest("GET", `/payment_type/${paymentTypeId}`);
  }

  async createPaymentType(data: { name: string }): Promise<unknown> {
    return this.makeRequest("POST", "/payment_type", undefined, data);
  }

  // ===== BANK ACCOUNTS (Read-Only, v3.0 API) =====
  async listBankAccounts(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeVersionedRequest("3.0", "GET", "banking/accounts", params);
  }

  async getBankAccount(accountId: number): Promise<unknown> {
    return this.makeVersionedRequest("3.0", "GET", `banking/accounts/${accountId}`);
  }

  // ===== CURRENCIES (v3.0 API) =====
  async listCurrencies(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeVersionedRequest("3.0", "GET", "currencies", params);
  }

  async getCurrency(currencyId: number): Promise<unknown> {
    return this.makeVersionedRequest("3.0", "GET", `currencies/${currencyId}`);
  }

  async createCurrency(data: { name: string; round_factor: number }): Promise<unknown> {
    return this.makeVersionedRequest("3.0", "POST", "currencies", undefined, data);
  }

  async updateCurrency(currencyId: number, data: Record<string, unknown>): Promise<unknown> {
    return this.makeVersionedRequest("3.0", "PATCH", `currencies/${currencyId}`, undefined, data);
  }

  async deleteCurrency(currencyId: number): Promise<unknown> {
    return this.makeVersionedRequest("3.0", "DELETE", `currencies/${currencyId}`);
  }

  // ===== IBAN PAYMENTS (Swiss ISO 20022) =====
  async createIbanPayment(data: {
    bank_account_id: number;
    iban: string;
    instructed_amount: { currency: string; amount: number };
    recipient: {
      name: string;
      street?: string;
      house_number?: string;
      zip: string;
      city: string;
      country_code: string;
    };
    execution_date: string;
    message?: string;
    is_salary_payment?: boolean;
    allowance_type?: string;
  }): Promise<unknown> {
    return this.makeRequest("POST", "/iban_payment", undefined, data);
  }

  async getIbanPayment(paymentId: number): Promise<unknown> {
    return this.makeRequest("GET", `/iban_payment/${paymentId}`);
  }

  async updateIbanPayment(paymentId: number, data: Record<string, unknown>): Promise<unknown> {
    return this.makeRequest("PATCH", `/iban_payment/${paymentId}`, undefined, data);
  }

  // ===== QR PAYMENTS (Swiss QR-invoice standard) =====
  async createQrPayment(data: {
    bank_account_id: number;
    iban: string;
    instructed_amount: { currency: string; amount: number };
    recipient: {
      name: string;
      street?: string;
      house_number?: string;
      zip: string;
      city: string;
      country_code: string;
    };
    execution_date: string;
    qr_reference_nr?: string;
    additional_information?: string;
  }): Promise<unknown> {
    return this.makeRequest("POST", "/qr_payment", undefined, data);
  }

  async getQrPayment(paymentId: number): Promise<unknown> {
    return this.makeRequest("GET", `/qr_payment/${paymentId}`);
  }

  async updateQrPayment(paymentId: number, data: Record<string, unknown>): Promise<unknown> {
    return this.makeRequest("PATCH", `/qr_payment/${paymentId}`, undefined, data);
  }

  // ===== ORDERS =====
  async listOrders(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeRequest("GET", "/kb_order", params);
  }

  async getOrder(orderId: number): Promise<unknown> {
    return this.makeRequest("GET", `/kb_order/${orderId}`);
  }

  async createOrder(orderData: OrderCreate): Promise<unknown> {
    return this.makeRequest("POST", "/kb_order", undefined, orderData);
  }

  async searchOrders(searchFilters: Array<{ field: string; operator: string; value: unknown }>, queryParams?: { limit?: number }): Promise<unknown[]> {
    return this.makeRequest("POST", "/kb_order/search", queryParams, searchFilters);
  }

  async searchOrdersByContactId(contactId: number): Promise<unknown[]> {
    const searchParams = [
      { field: "contact_id", operator: "=", value: contactId.toString() },
    ];
    return this.makeRequest("POST", "/kb_order/search", undefined, searchParams);
  }

  async createDeliveryFromOrder(orderId: number): Promise<unknown> {
    return this.makeRequest("POST", `/kb_order/${orderId}/delivery`);
  }

  async createInvoiceFromOrder(orderId: number): Promise<unknown> {
    return this.makeRequest("POST", `/kb_order/${orderId}/invoice`);
  }

  async editOrder(orderId: number, orderData: Record<string, unknown>): Promise<unknown> {
    return this.makeRequest("PUT", `/kb_order/${orderId}`, undefined, orderData);
  }

  async deleteOrder(orderId: number): Promise<unknown> {
    return this.makeRequest("DELETE", `/kb_order/${orderId}`);
  }

  async getOrderPdf(orderId: number): Promise<unknown> {
    const response = await this.client.get(`/kb_order/${orderId}/pdf`, {
      responseType: "arraybuffer",
    });
    const base64 = Buffer.from(response.data).toString("base64");
    return { content: base64, content_type: "application/pdf", filename: `order_${orderId}.pdf` };
  }

  async getOrderRepetition(orderId: number): Promise<unknown> {
    return this.makeRequest("GET", `/kb_order/${orderId}/repetition`);
  }

  async editOrderRepetition(orderId: number, repetitionId: number, data: Record<string, unknown>): Promise<unknown> {
    return this.makeRequest("PUT", `/kb_order/${orderId}/repetition/${repetitionId}`, undefined, data);
  }

  async deleteOrderRepetition(orderId: number, repetitionId: number): Promise<unknown> {
    return this.makeRequest("DELETE", `/kb_order/${orderId}/repetition/${repetitionId}`);
  }

  // ===== CONTACTS =====
  async listContacts(params: ContactSearchParams = {}): Promise<unknown[]> {
    const searchParams: Record<string, unknown> = {
      limit: params.limit ?? 50,
      offset: params.offset ?? 0,
    };

    if (params.search_term) {
      searchParams["search"] = params.search_term;
    }
    if (params.contact_type_id) {
      searchParams["contact_type_id"] = params.contact_type_id;
    }

    return this.makeRequest("GET", "/contact", searchParams);
  }

  async getContact(contactId: number): Promise<unknown> {
    return this.makeRequest("GET", `/contact/${contactId}`);
  }

  async searchContacts(query: string, limit = 50): Promise<unknown[]> {
    const searchCriteria: SearchCriteria[] = [
      { field: "name_1", value: query, criteria: "like" },
    ];
    return this.advancedSearchContacts(searchCriteria, limit);
  }

  async advancedSearchContacts(
    searchCriteria: SearchCriteria[],
    limit = 50
  ): Promise<unknown[]> {
    const params = { limit };
    return this.makeRequest("POST", "/contact/search", params, searchCriteria);
  }

  async findContactByNumber(contactNumber: string): Promise<unknown> {
    const searchCriteria: SearchCriteria[] = [
      { field: "nr", value: contactNumber, criteria: "=" },
    ];
    const contacts = await this.advancedSearchContacts(searchCriteria, 1);

    if (Array.isArray(contacts) && contacts.length > 0) {
      return contacts[0];
    }

    throw McpError.notFound("Contact", contactNumber);
  }

  async findContactByName(name: string): Promise<unknown[]> {
    const searchCriteria: SearchCriteria[] = [
      { field: "name_1", value: name, criteria: "like" },
    ];
    return this.advancedSearchContacts(searchCriteria, 100);
  }

  async updateContact(
    contactId: number,
    contactData: Record<string, unknown>
  ): Promise<unknown> {
    return this.makeRequest("POST", `/contact/${contactId}`, undefined, contactData);
  }

  async createContact(data: Record<string, unknown>): Promise<unknown> {
    return this.makeRequest("POST", "/contact", undefined, data);
  }

  async deleteContact(contactId: number): Promise<unknown> {
    return this.makeRequest("DELETE", `/contact/${contactId}`);
  }

  async bulkCreateContacts(
    contacts: Record<string, unknown>[]
  ): Promise<{ results: Array<{ success: true; contact: unknown } | { success: false; error: string }>; summary: { created: number; failed: number; total: number } }> {
    const results: Array<{ success: true; contact: unknown } | { success: false; error: string }> = [];
    for (const contactData of contacts) {
      try {
        const contact = await this.makeRequest("POST", "/contact", undefined, contactData);
        results.push({ success: true, contact });
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        results.push({ success: false, error: message });
      }
    }
    const created = results.filter((r) => r.success).length;
    return {
      results,
      summary: { created, failed: results.length - created, total: results.length },
    };
  }

  async restoreContact(contactId: number): Promise<unknown> {
    return this.makeRequest("PATCH", `/contact/${contactId}/restore`);
  }

  // ===== QUOTES =====
  async createQuote(quoteData: Record<string, unknown>): Promise<unknown> {
    return this.makeRequest("POST", "/kb_offer", undefined, quoteData);
  }

  async listQuotes(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeRequest("GET", "/kb_offer", params);
  }

  async getQuote(quoteId: number): Promise<unknown> {
    return this.makeRequest("GET", `/kb_offer/${quoteId}`);
  }

  async searchQuotes(searchFilters: Array<{ field: string; operator: string; value: unknown }>, queryParams?: { limit?: number }): Promise<unknown[]> {
    return this.makeRequest("POST", "/kb_offer/search", queryParams, searchFilters);
  }

  async searchQuotesByContactId(contactId: number): Promise<unknown[]> {
    const searchParams = [
      { field: "contact_id", operator: "=", value: contactId.toString() },
    ];
    return this.makeRequest("POST", "/kb_offer/search", undefined, searchParams);
  }

  async issueQuote(quoteId: number): Promise<unknown> {
    return this.makeRequest("POST", `/kb_offer/${quoteId}/issue`);
  }

  async acceptQuote(quoteId: number): Promise<unknown> {
    return this.makeRequest("POST", `/kb_offer/${quoteId}/accept`);
  }

  async declineQuote(quoteId: number): Promise<unknown> {
    return this.makeRequest("POST", `/kb_offer/${quoteId}/reject`);
  }

  async sendQuote(quoteId: number): Promise<unknown> {
    return this.makeRequest("POST", `/kb_offer/${quoteId}/send`);
  }

  async createOrderFromQuote(quoteId: number): Promise<unknown> {
    return this.makeRequest("POST", `/kb_offer/${quoteId}/order`);
  }

  async createInvoiceFromQuote(quoteId: number): Promise<unknown> {
    return this.makeRequest("POST", `/kb_offer/${quoteId}/invoice`);
  }

  async editQuote(quoteId: number, quoteData: Record<string, unknown>): Promise<unknown> {
    return this.makeRequest("PUT", `/kb_offer/${quoteId}`, undefined, quoteData);
  }

  async deleteQuote(quoteId: number): Promise<unknown> {
    return this.makeRequest("DELETE", `/kb_offer/${quoteId}`);
  }

  async revertQuote(quoteId: number): Promise<unknown> {
    return this.makeRequest("POST", `/kb_offer/${quoteId}/revertIssue`);
  }

  async reissueQuote(quoteId: number): Promise<unknown> {
    return this.makeRequest("POST", `/kb_offer/${quoteId}/reissue`);
  }

  async markQuoteAsSent(quoteId: number): Promise<unknown> {
    return this.makeRequest("POST", `/kb_offer/${quoteId}/mark_as_sent`);
  }

  async getQuotePdf(quoteId: number): Promise<unknown> {
    const response = await this.client.get(`/kb_offer/${quoteId}/pdf`, {
      responseType: "arraybuffer",
    });
    const base64 = Buffer.from(response.data).toString("base64");
    return { content: base64, content_type: "application/pdf", filename: `quote_${quoteId}.pdf` };
  }

  async copyQuote(quoteId: number): Promise<unknown> {
    // Bexio copy endpoint requires contact_id in body
    const original = await this.getQuote(quoteId) as Record<string, unknown>;
    return this.makeRequest("POST", `/kb_offer/${quoteId}/copy`, undefined, {
      contact_id: original.contact_id,
    });
  }

  // ===== INVOICES =====
  async listInvoices(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeRequest("GET", "/kb_invoice", params);
  }

  async getInvoice(invoiceId: number): Promise<unknown> {
    return this.makeRequest("GET", `/kb_invoice/${invoiceId}`);
  }

  async createInvoice(invoiceData: InvoiceCreate): Promise<unknown> {
    // Set current date if not provided
    if (!invoiceData.is_valid_from) {
      invoiceData.is_valid_from = new Date().toISOString().split("T")[0];
    }
    return this.makeRequest("POST", "/kb_invoice", undefined, invoiceData);
  }

  async listAllInvoices(chunkSize = 100): Promise<unknown[]> {
    if (chunkSize <= 0) {
      throw McpError.validation("chunk_size must be positive");
    }

    const invoices: unknown[] = [];
    let offset = 0;

    while (offset < 10000) {
      const batch = await this.listInvoices({ limit: chunkSize, offset });
      if (!Array.isArray(batch) || batch.length === 0) {
        break;
      }

      invoices.push(...batch);

      if (batch.length < chunkSize) {
        break;
      }

      offset += chunkSize;
    }

    return invoices;
  }

  async searchInvoices(params: InvoiceSearchParams): Promise<unknown[]> {
    const searchFilters: Array<{
      field: string;
      operator: string;
      value: unknown;
    }> = [];

    if (params.filters) {
      if (!Array.isArray(params.filters)) {
        throw McpError.validation("filters must be a list of search expressions");
      }
      searchFilters.push(...params.filters);
    }

    if (params.query !== undefined) {
      const op = params.operator?.toUpperCase() ?? "LIKE";
      let value = params.query;
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

    const requestParams = params.limit ? { limit: params.limit } : undefined;
    return this.makeRequest(
      "POST",
      "/kb_invoice/search",
      requestParams,
      searchFilters
    );
  }

  async issueInvoice(invoiceId: number): Promise<unknown> {
    return this.makeRequest("POST", `/kb_invoice/${invoiceId}/issue`);
  }

  async cancelInvoice(invoiceId: number): Promise<unknown> {
    return this.makeRequest("POST", `/kb_invoice/${invoiceId}/cancel`);
  }

  async markInvoiceAsSent(invoiceId: number): Promise<unknown> {
    return this.makeRequest("POST", `/kb_invoice/${invoiceId}/mark_as_sent`);
  }

  async sendInvoice(invoiceId: number): Promise<unknown> {
    return this.makeRequest("POST", `/kb_invoice/${invoiceId}/send`);
  }

  async copyInvoice(invoiceId: number): Promise<unknown> {
    // Bexio copy endpoint requires contact_id in body
    const original = await this.getInvoice(invoiceId) as Record<string, unknown>;
    return this.makeRequest("POST", `/kb_invoice/${invoiceId}/copy`, undefined, {
      contact_id: original.contact_id,
    });
  }

  async editInvoice(invoiceId: number, invoiceData: Record<string, unknown>): Promise<unknown> {
    return this.makeRequest("PUT", `/kb_invoice/${invoiceId}`, undefined, invoiceData);
  }

  async deleteInvoice(invoiceId: number): Promise<unknown> {
    return this.makeRequest("DELETE", `/kb_invoice/${invoiceId}`);
  }

  async getInvoicePdf(invoiceId: number): Promise<unknown> {
    const response = await this.client.get(`/kb_invoice/${invoiceId}/pdf`, {
      responseType: "arraybuffer",
    });
    const base64 = Buffer.from(response.data).toString("base64");
    return { content: base64, content_type: "application/pdf", filename: `invoice_${invoiceId}.pdf` };
  }

  async revertInvoice(invoiceId: number): Promise<unknown> {
    return this.makeRequest("POST", `/kb_invoice/${invoiceId}/revert_issue`);
  }

  // ===== TAXES (3.0 API) =====
  async listTaxes(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeVersionedRequest("3.0", "GET", "taxes", params);
  }

  async getTax(taxId: number): Promise<unknown> {
    return this.makeVersionedRequest("3.0", "GET", `taxes/${taxId}`);
  }

  // ===== ITEMS (Articles) =====
  async listItems(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeRequest("GET", "/article", params);
  }

  async getItem(itemId: number): Promise<unknown> {
    return this.makeRequest("GET", `/article/${itemId}`);
  }

  async createItem(itemData: Record<string, unknown>): Promise<unknown> {
    return this.makeRequest("POST", "/article", undefined, itemData);
  }

  async editItem(
    itemId: number,
    itemData: Record<string, unknown>
  ): Promise<unknown> {
    return this.makeRequest("PUT", `/article/${itemId}`, undefined, itemData);
  }

  async deleteItem(itemId: number): Promise<unknown> {
    return this.makeRequest("DELETE", `/article/${itemId}`);
  }

  async searchItems(query: string, limit = 100): Promise<unknown[]> {
    const criteria: SearchCriteria[] = [
      { field: "intern_name", value: query, criteria: "like" },
    ];
    return this.makeRequest("POST", "/article/search", { limit }, criteria);
  }

  // ===== DELIVERIES =====
  async listDeliveries(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeRequest("GET", "/kb_delivery", params);
  }

  async getDelivery(deliveryId: number): Promise<unknown> {
    return this.makeRequest("GET", `/kb_delivery/${deliveryId}`);
  }

  async issueDelivery(deliveryId: number): Promise<unknown> {
    return this.makeRequest("POST", `/kb_delivery/${deliveryId}/issue`);
  }

  async searchDeliveries(
    searchFilters: Array<{ field: string; operator: string; value: unknown }>,
    queryParams?: { limit?: number }
  ): Promise<unknown[]> {
    return this.makeRequest("POST", "/kb_delivery/search", queryParams, searchFilters);
  }

  // ===== PAYMENTS =====
  async listPayments(invoiceId: number): Promise<unknown[]> {
    return this.makeRequest("GET", `/kb_invoice/${invoiceId}/payment`);
  }

  async createPayment(
    invoiceId: number,
    paymentData: Record<string, unknown>
  ): Promise<unknown> {
    return this.makeRequest(
      "POST",
      `/kb_invoice/${invoiceId}/payment`,
      undefined,
      paymentData
    );
  }

  async getPayment(invoiceId: number, paymentId: number): Promise<unknown> {
    return this.makeRequest(
      "GET",
      `/kb_invoice/${invoiceId}/payment/${paymentId}`
    );
  }

  async deletePayment(invoiceId: number, paymentId: number): Promise<unknown> {
    return this.makeRequest(
      "DELETE",
      `/kb_invoice/${invoiceId}/payment/${paymentId}`
    );
  }

  // ===== REMINDERS =====
  async listReminders(invoiceId: number): Promise<unknown[]> {
    return this.makeRequest("GET", `/kb_invoice/${invoiceId}/kb_reminder`);
  }

  async createReminder(
    invoiceId: number,
    reminderData: Record<string, unknown>
  ): Promise<unknown> {
    return this.makeRequest(
      "POST",
      `/kb_invoice/${invoiceId}/kb_reminder`,
      undefined,
      reminderData
    );
  }

  async getReminder(invoiceId: number, reminderId: number): Promise<unknown> {
    return this.makeRequest(
      "GET",
      `/kb_invoice/${invoiceId}/kb_reminder/${reminderId}`
    );
  }

  async deleteReminder(invoiceId: number, reminderId: number): Promise<unknown> {
    return this.makeRequest(
      "DELETE",
      `/kb_invoice/${invoiceId}/kb_reminder/${reminderId}`
    );
  }

  async markReminderAsSent(
    invoiceId: number,
    reminderId: number
  ): Promise<unknown> {
    return this.makeRequest(
      "POST",
      `/kb_invoice/${invoiceId}/kb_reminder/${reminderId}/mark_as_sent`
    );
  }

  async sendReminder(invoiceId: number, reminderId: number): Promise<unknown> {
    return this.makeRequest(
      "POST",
      `/kb_invoice/${invoiceId}/kb_reminder/${reminderId}/send`
    );
  }

  async markReminderAsUnsent(
    invoiceId: number,
    reminderId: number
  ): Promise<unknown> {
    return this.makeRequest(
      "POST",
      `/kb_invoice/${invoiceId}/kb_reminder/${reminderId}/mark_as_unsent`
    );
  }

  async getReminderPdf(
    invoiceId: number,
    reminderId: number
  ): Promise<unknown> {
    const response = await this.client.request({
      method: "GET",
      url: `/kb_invoice/${invoiceId}/kb_reminder/${reminderId}/pdf`,
      responseType: "arraybuffer",
    });
    const base64 = Buffer.from(response.data).toString("base64");
    return {
      content: base64,
      content_type: "application/pdf",
      filename: `reminder_${reminderId}.pdf`,
    };
  }

  // ===== CONTACT RELATIONS =====
  async listContactRelations(): Promise<unknown[]> {
    return this.makeRequest("GET", "/contact_relation");
  }

  async createContactRelation(
    relationData: Record<string, unknown>
  ): Promise<unknown> {
    return this.makeRequest("POST", "/contact_relation", undefined, relationData);
  }

  async getContactRelation(relationId: number): Promise<unknown> {
    return this.makeRequest("GET", `/contact_relation/${relationId}`);
  }

  async updateContactRelation(
    relationId: number,
    relationData: Record<string, unknown>
  ): Promise<unknown> {
    return this.makeRequest(
      "POST",
      `/contact_relation/${relationId}`,
      undefined,
      relationData
    );
  }

  async deleteContactRelation(relationId: number): Promise<unknown> {
    return this.makeRequest("DELETE", `/contact_relation/${relationId}`);
  }

  async searchContactRelations(
    searchFilters: Array<{ field: string; operator: string; value: unknown }>,
    queryParams?: { limit?: number }
  ): Promise<unknown[]> {
    return this.makeRequest(
      "POST",
      "/contact_relation/search",
      queryParams,
      searchFilters
    );
  }

  // ===== REAL USERS (USERS-01, v3.0 API) =====
  async listUsers(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeVersionedRequest("3.0", "GET", "users", params);
  }

  async getUser(userId: number): Promise<unknown> {
    return this.makeVersionedRequest("3.0", "GET", `users/${userId}`);
  }

  // ===== FICTIONAL USERS & CURRENT USER =====
  async getCurrentUser(): Promise<unknown> {
    return this.makeVersionedRequest("3.0", "GET", "users/me");
  }

  async listFictionalUsers(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeVersionedRequest("3.0", "GET", "fictional_users", params);
  }

  async getFictionalUser(userId: number): Promise<unknown> {
    return this.makeVersionedRequest("3.0", "GET", `fictional_users/${userId}`);
  }

  async createFictionalUser(userData: Record<string, unknown>): Promise<unknown> {
    return this.makeVersionedRequest("3.0", "POST", "fictional_users", undefined, userData);
  }

  async updateFictionalUser(
    userId: number,
    userData: Record<string, unknown>
  ): Promise<unknown> {
    return this.makeVersionedRequest("3.0", "POST", `fictional_users/${userId}`, undefined, userData);
  }

  async deleteFictionalUser(userId: number): Promise<unknown> {
    return this.makeVersionedRequest("3.0", "DELETE", `fictional_users/${userId}`);
  }

  // ===== COMMENTS (nested under document type) =====
  // API: /{kb_document_type}/{document_id}/comment
  // kb_document_type: kb_offer, kb_order, kb_invoice, kb_delivery
  async listComments(documentType: string, documentId: number): Promise<unknown[]> {
    return this.makeRequest("GET", `/${documentType}/${documentId}/comment`);
  }

  async getComment(documentType: string, documentId: number, commentId: number): Promise<unknown> {
    return this.makeRequest("GET", `/${documentType}/${documentId}/comment/${commentId}`);
  }

  async createComment(documentType: string, documentId: number, commentData: Record<string, unknown>): Promise<unknown> {
    return this.makeRequest("POST", `/${documentType}/${documentId}/comment`, undefined, commentData);
  }

  // ===== SEARCH REMINDERS =====
  async searchReminders(searchParams: Record<string, unknown>): Promise<unknown[]> {
    // Search across all invoices to find reminders matching criteria
    // This is a computed operation - get all recent invoices and their reminders
    const invoices = await this.listAllInvoices(100);
    const allReminders: unknown[] = [];

    for (const invoice of invoices.slice(0, 50)) {
      const invoiceId = (invoice as { id?: number }).id;
      if (invoiceId) {
        try {
          const reminders = await this.listReminders(invoiceId);
          allReminders.push(
            ...(reminders as unknown[]).map((r) => ({
              ...(r as object),
              invoice_id: invoiceId,
            }))
          );
        } catch {
          // Invoice may not have reminders, skip
        }
      }
    }

    return allReminders;
  }

  async getRemindersSentThisWeek(): Promise<unknown[]> {
    // Get reminders sent this week
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const allReminders = await this.searchReminders({});
    return allReminders.filter((r) => {
      const sentDate = (r as { sent_date?: string }).sent_date;
      if (!sentDate) return false;
      const date = new Date(sentDate);
      return date >= startOfWeek;
    });
  }

  // ===== REPORTS (Computed from invoice data) =====
  async getRevenueReport(
    startDate: string,
    endDate: string,
    groupBy?: string
  ): Promise<unknown> {
    // Compute revenue from paid invoices in date range
    const invoices = await this.listAllInvoices(100);
    const filteredInvoices = invoices.filter((inv) => {
      const invoice = inv as {
        is_valid_from?: string;
        kb_item_status_id?: number;
      };
      const invDate = invoice.is_valid_from;
      // Status 9 = paid
      const isPaid = invoice.kb_item_status_id === 9;
      if (!invDate || !isPaid) return false;
      return invDate >= startDate && invDate <= endDate;
    });

    const totalRevenue = filteredInvoices.reduce((sum: number, inv) => {
      const total = (inv as { total?: number }).total ?? 0;
      return sum + total;
    }, 0);

    return {
      start_date: startDate,
      end_date: endDate,
      total_revenue: totalRevenue,
      invoice_count: filteredInvoices.length,
      group_by: groupBy || null,
    };
  }

  async getCustomerRevenueReport(
    startDate: string,
    endDate: string,
    limit = 10
  ): Promise<unknown[]> {
    const invoices = await this.listAllInvoices(100);
    const customerRevenue: Record<number, { contact_id: number; total: number; count: number }> =
      {};

    invoices.forEach((inv) => {
      const invoice = inv as {
        contact_id?: number;
        is_valid_from?: string;
        total?: number;
        kb_item_status_id?: number;
      };
      if (
        invoice.contact_id &&
        invoice.is_valid_from &&
        invoice.is_valid_from >= startDate &&
        invoice.is_valid_from <= endDate &&
        invoice.kb_item_status_id === 9
      ) {
        if (!customerRevenue[invoice.contact_id]) {
          customerRevenue[invoice.contact_id] = {
            contact_id: invoice.contact_id,
            total: 0,
            count: 0,
          };
        }
        customerRevenue[invoice.contact_id].total += invoice.total ?? 0;
        customerRevenue[invoice.contact_id].count += 1;
      }
    });

    return Object.values(customerRevenue)
      .sort((a, b) => b.total - a.total)
      .slice(0, limit);
  }

  async getInvoiceStatusReport(
    startDate: string,
    endDate: string
  ): Promise<unknown> {
    const invoices = await this.listAllInvoices(100);
    const statusCounts: Record<number, number> = {};

    invoices.forEach((inv) => {
      const invoice = inv as {
        is_valid_from?: string;
        kb_item_status_id?: number;
      };
      if (
        invoice.is_valid_from &&
        invoice.is_valid_from >= startDate &&
        invoice.is_valid_from <= endDate &&
        invoice.kb_item_status_id
      ) {
        statusCounts[invoice.kb_item_status_id] =
          (statusCounts[invoice.kb_item_status_id] || 0) + 1;
      }
    });

    return {
      start_date: startDate,
      end_date: endDate,
      status_counts: statusCounts,
    };
  }

  async getOverdueInvoicesReport(): Promise<unknown[]> {
    return this.getOverdueInvoices();
  }

  async getMonthlyRevenueReport(year: number, month: number): Promise<unknown> {
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, "0")}-${lastDay}`;

    return this.getRevenueReport(startDate, endDate);
  }

  async getTopCustomersByRevenue(
    limit = 10,
    startDate?: string,
    endDate?: string
  ): Promise<unknown[]> {
    const start = startDate || "2000-01-01";
    const end = endDate || new Date().toISOString().split("T")[0];
    return this.getCustomerRevenueReport(start, end, limit);
  }

  // ===== BUSINESS LOGIC =====
  async getOpenInvoices(): Promise<unknown[]> {
    // Status 7 = Draft/Open, Status 8 = Sent/Pending
    const invoices = await this.listAllInvoices(100);
    return invoices.filter((inv) => {
      const statusId = (inv as { kb_item_status_id?: number }).kb_item_status_id;
      return statusId === 7 || statusId === 8;
    });
  }

  async getOverdueInvoices(): Promise<unknown[]> {
    const today = new Date().toISOString().split("T")[0];
    const invoices = await this.listAllInvoices(100);

    return invoices.filter((inv) => {
      const invoice = inv as {
        kb_item_status_id?: number;
        is_valid_until?: string;
      };
      // Status 8 = Sent but not paid, and due date passed
      return (
        invoice.kb_item_status_id === 8 &&
        invoice.is_valid_until &&
        invoice.is_valid_until < today
      );
    });
  }

  async getTasksDueThisWeek(): Promise<unknown[]> {
    const now = new Date();
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (6 - now.getDay()));

    const today = now.toISOString().split("T")[0];
    const weekEnd = endOfWeek.toISOString().split("T")[0];

    const invoices = await this.listAllInvoices(100);

    return invoices.filter((inv) => {
      const invoice = inv as {
        kb_item_status_id?: number;
        is_valid_until?: string;
      };
      // Open or sent invoices with due date this week
      const isOpen = invoice.kb_item_status_id === 7 || invoice.kb_item_status_id === 8;
      const dueDate = invoice.is_valid_until;
      return isOpen && dueDate && dueDate >= today && dueDate <= weekEnd;
    });
  }

  // ===== STATIC DATA =====
  async listInvoiceStatuses(): Promise<unknown[]> {
    return [
      {
        id: 7,
        name: "Entwurf/Offen",
        english_name: "Draft/Open",
        is_open: true,
        is_sent: false,
        is_paid: false,
        is_cancelled: false,
      },
      {
        id: 8,
        name: "Versendet/Ausstehend",
        english_name: "Sent/Pending",
        is_open: false,
        is_sent: true,
        is_paid: false,
        is_cancelled: false,
      },
      {
        id: 9,
        name: "Bezahlt/Abgeschlossen",
        english_name: "Paid/Completed",
        is_open: false,
        is_sent: true,
        is_paid: true,
        is_cancelled: false,
      },
      {
        id: 19,
        name: "Storniert",
        english_name: "Cancelled",
        is_open: false,
        is_sent: false,
        is_paid: false,
        is_cancelled: true,
      },
    ];
  }

  async listAllStatuses(
    documentType: "all" | "invoices" | "quotes" | "orders" = "all"
  ): Promise<unknown[]> {
    const statuses = {
      invoices: await this.listInvoiceStatuses(),
      quotes: [
        { id: 1, name: "Entwurf", english_name: "Draft", document_type: "quote" },
        { id: 3, name: "Versendet", english_name: "Sent", document_type: "quote" },
      ],
      orders: [
        {
          id: 5,
          name: "Bestatigt",
          english_name: "Confirmed",
          document_type: "order",
        },
        {
          id: 21,
          name: "Wiederkehrend",
          english_name: "Recurring",
          document_type: "order",
        },
      ],
    };

    if (documentType === "all") {
      return [...statuses.invoices, ...statuses.quotes, ...statuses.orders];
    }

    return statuses[documentType] || [];
  }

  // ===== PROJECTS =====
  async listProjects(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeRequest("GET", "/pr_project", params);
  }

  async getProject(projectId: number): Promise<unknown> {
    return this.makeRequest("GET", `/pr_project/${projectId}`);
  }

  async createProject(data: {
    user_id: number;
    name: string;
    contact_id: number;
    pr_state_id: number;
    pr_project_type_id: number;
    start_date?: string;
    end_date?: string;
    comment?: string;
  }): Promise<unknown> {
    return this.makeRequest("POST", "/pr_project", undefined, data);
  }

  async updateProject(projectId: number, data: Record<string, unknown>): Promise<unknown> {
    return this.makeRequest("POST", `/pr_project/${projectId}`, undefined, data);
  }

  async deleteProject(projectId: number): Promise<unknown> {
    return this.makeRequest("DELETE", `/pr_project/${projectId}`);
  }

  async archiveProject(projectId: number): Promise<unknown> {
    return this.makeRequest("POST", `/pr_project/${projectId}/archive`);
  }

  async unarchiveProject(projectId: number): Promise<unknown> {
    return this.makeRequest("POST", `/pr_project/${projectId}/reactivate`);
  }

  async searchProjects(searchParams: Record<string, unknown>[]): Promise<unknown[]> {
    return this.makeRequest("POST", "/pr_project/search", undefined, searchParams);
  }

  // ===== PROJECT TYPES =====
  async listProjectTypes(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeRequest("GET", "/pr_project_type", params);
  }

  async getProjectType(typeId: number): Promise<unknown> {
    return this.makeRequest("GET", `/pr_project_type/${typeId}`);
  }

  // ===== PROJECT STATUSES =====
  async listProjectStatuses(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeRequest("GET", "/pr_project_state", params);
  }

  async getProjectStatus(statusId: number): Promise<unknown> {
    return this.makeRequest("GET", `/pr_project_state/${statusId}`);
  }

  // ===== MILESTONES (PROJ-04, v3.0 API) =====
  async listMilestones(projectId: number, params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeVersionedRequest("3.0", "GET", `projects/${projectId}/milestones`, params);
  }

  async getMilestone(projectId: number, milestoneId: number): Promise<unknown> {
    return this.makeVersionedRequest("3.0", "GET", `projects/${projectId}/milestones/${milestoneId}`);
  }

  async createMilestone(projectId: number, data: { name: string; end_date?: string }): Promise<unknown> {
    return this.makeVersionedRequest("3.0", "POST", `projects/${projectId}/milestones`, undefined, data);
  }

  async deleteMilestone(projectId: number, milestoneId: number): Promise<unknown> {
    return this.makeVersionedRequest("3.0", "DELETE", `projects/${projectId}/milestones/${milestoneId}`);
  }

  // ===== WORK PACKAGES (PROJ-05, v3.0 API — "packages" in API) =====
  async listWorkPackages(projectId: number, params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeVersionedRequest("3.0", "GET", `projects/${projectId}/packages`, params);
  }

  async getWorkPackage(projectId: number, workpackageId: number): Promise<unknown> {
    return this.makeVersionedRequest("3.0", "GET", `projects/${projectId}/packages/${workpackageId}`);
  }

  async createWorkPackage(projectId: number, data: { name: string; estimated_time?: string }): Promise<unknown> {
    return this.makeVersionedRequest("3.0", "POST", `projects/${projectId}/packages`, undefined, data);
  }

  async updateWorkPackage(projectId: number, workpackageId: number, data: Record<string, unknown>): Promise<unknown> {
    return this.makeVersionedRequest("3.0", "PATCH", `projects/${projectId}/packages/${workpackageId}`, undefined, data);
  }

  async deleteWorkPackage(projectId: number, workpackageId: number): Promise<unknown> {
    return this.makeVersionedRequest("3.0", "DELETE", `projects/${projectId}/packages/${workpackageId}`);
  }

  // ===== TIMESHEETS (PROJ-06) =====
  // Note: Duration format is "HH:MM" (e.g., "02:30" for 2.5 hours)
  async listTimesheets(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeRequest("GET", "/timesheet", params);
  }

  async getTimesheet(timesheetId: number): Promise<unknown> {
    return this.makeRequest("GET", `/timesheet/${timesheetId}`);
  }

  async createTimesheet(data: {
    user_id: number;
    client_service_id: number;
    tracking: {
      date: string; // DD.MM.YYYY format
      duration: string; // HH:MM format
    };
    pr_project_id?: number;
    pr_package_id?: number;
    pr_milestone_id?: number;
    text?: string;
    allowable_bill?: boolean;
  }): Promise<unknown> {
    return this.makeRequest("POST", "/timesheet", undefined, data);
  }

  async deleteTimesheet(timesheetId: number): Promise<unknown> {
    return this.makeRequest("DELETE", `/timesheet/${timesheetId}`);
  }

  async searchTimesheets(searchParams: Record<string, unknown>[]): Promise<unknown[]> {
    return this.makeRequest("POST", "/timesheet/search", undefined, searchParams);
  }

  // ===== TIMESHEET STATUSES (PROJ-07) =====
  async listTimesheetStatuses(): Promise<unknown[]> {
    return this.makeRequest("GET", "/timesheet_status");
  }

  // ===== BUSINESS ACTIVITIES (PROJ-08) =====
  // Also known as "client_service" in Bexio API
  async listBusinessActivities(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeRequest("GET", "/client_service", params);
  }

  async getBusinessActivity(activityId: number): Promise<unknown> {
    return this.makeRequest("GET", `/client_service/${activityId}`);
  }

  async createBusinessActivity(data: { name: string }): Promise<unknown> {
    return this.makeRequest("POST", "/client_service", undefined, data);
  }

  // ===== COMMUNICATION TYPES (PROJ-09) =====
  async listCommunicationTypes(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeRequest("GET", "/communication_kind", params);
  }

  async getCommunicationType(typeId: number): Promise<unknown> {
    return this.makeRequest("GET", `/communication_kind/${typeId}`);
  }

  // ===== ACCOUNTS (Chart of Accounts - ACCT-01) =====
  async listAccounts(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeRequest("GET", "/accounts", params);
  }

  async getAccount(accountId: number): Promise<unknown> {
    return this.makeRequest("GET", `/accounts/${accountId}`);
  }

  async createAccount(data: {
    account_no: number;
    name: string;
    account_group_id: number;
    is_active?: boolean;
    tax_id?: number;
  }): Promise<unknown> {
    return this.makeRequest("POST", "/accounts", undefined, data);
  }

  async searchAccounts(searchParams: Record<string, unknown>[]): Promise<unknown[]> {
    return this.makeRequest("POST", "/accounts/search", undefined, searchParams);
  }

  // ===== ACCOUNT GROUPS (ACCT-02) =====
  async listAccountGroups(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeRequest("GET", "/account_groups", params);
  }

  // ===== CALENDAR YEARS (ACCT-03, v3.0 API) =====
  async listCalendarYears(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeVersionedRequest("3.0", "GET", "accounting/calendar_years", params);
  }

  async getCalendarYear(yearId: number): Promise<unknown> {
    return this.makeVersionedRequest("3.0", "GET", `accounting/calendar_years/${yearId}`);
  }

  // ===== BUSINESS YEARS (ACCT-04, v3.0 API) =====
  async listBusinessYears(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeVersionedRequest("3.0", "GET", "accounting/business_years", params);
  }

  // ===== MANUAL ENTRIES (ACCT-05, v3.0 API) =====
  async listManualEntries(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeVersionedRequest("3.0", "GET", "accounting/manual_entries", params);
  }

  async getManualEntry(entryId: number): Promise<unknown> {
    return this.makeVersionedRequest("3.0", "GET", `accounting/manual_entries/${entryId}`);
  }

  async createManualEntry(data: {
    type: string;
    date: string;
    reference_nr?: string;
    entries: Array<{
      debit_account_id: number;
      credit_account_id: number;
      tax_id?: number;
      tax_account_id?: number;
      description: string;
      amount: number;
      currency_id?: number;
      currency_factor?: number;
    }>;
  }): Promise<unknown> {
    return this.makeVersionedRequest("3.0", "POST", "accounting/manual_entries", undefined, data);
  }

  async updateManualEntry(entryId: number, data: Record<string, unknown>): Promise<unknown> {
    return this.makeVersionedRequest("3.0", "PUT", `accounting/manual_entries/${entryId}`, undefined, data);
  }

  async deleteManualEntry(entryId: number): Promise<unknown> {
    return this.makeVersionedRequest("3.0", "DELETE", `accounting/manual_entries/${entryId}`);
  }

  // ===== VAT PERIODS (ACCT-06, v3.0 API) =====
  async listVatPeriods(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeVersionedRequest("3.0", "GET", "accounting/vat_periods", params);
  }

  // ===== ACCOUNTING JOURNAL (ACCT-07, v3.0 API) =====
  async getJournal(params: {
    start_date?: string;
    end_date?: string;
    limit?: number;
    offset?: number;
  }): Promise<unknown[]> {
    return this.makeVersionedRequest("3.0", "GET", "accounting/journal", params as Record<string, unknown>);
  }

  // ===== BILLS (Creditor Invoices - PURCH-01, v4.0 API) =====
  async listBills(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeVersionedRequest("4.0", "GET", "purchase/bills", params);
  }

  async getBill(billId: string): Promise<unknown> {
    return this.makeVersionedRequest("4.0", "GET", `purchase/bills/${billId}`);
  }

  async createBill(data: Record<string, unknown>): Promise<unknown> {
    return this.makeVersionedRequest("4.0", "POST", "purchase/bills", undefined, data);
  }

  async updateBill(billId: string, data: Record<string, unknown>): Promise<unknown> {
    return this.makeVersionedRequest("4.0", "PUT", `purchase/bills/${billId}`, undefined, data);
  }

  async deleteBill(billId: string): Promise<unknown> {
    return this.makeVersionedRequest("4.0", "DELETE", `purchase/bills/${billId}`);
  }

  async searchBills(searchParams: Record<string, unknown>[], queryParams?: { limit?: number; offset?: number }): Promise<unknown[]> {
    // Bexio v4.0 bills API does not support POST /search — use GET with query params
    const params: Record<string, unknown> = { ...queryParams };
    for (const criterion of searchParams) {
      if (criterion.field && criterion.value !== undefined) {
        params[criterion.field as string] = criterion.value;
      }
    }
    return this.makeVersionedRequest("4.0", "GET", "purchase/bills", params);
  }

  async issueBill(billId: string): Promise<unknown> {
    return this.makeVersionedRequest("4.0", "POST", `purchase/bills/${billId}/issue`);
  }

  async markBillAsPaid(billId: string): Promise<unknown> {
    return this.makeVersionedRequest("4.0", "POST", `purchase/bills/${billId}/mark_as_paid`);
  }

  // ===== EXPENSES (PURCH-02, v3.0 API) =====
  async listExpenses(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeVersionedRequest("3.0", "GET", "purchase/expenses", params);
  }

  async getExpense(expenseId: string): Promise<unknown> {
    return this.makeVersionedRequest("3.0", "GET", `purchase/expenses/${expenseId}`);
  }

  async createExpense(data: Record<string, unknown>): Promise<unknown> {
    return this.makeVersionedRequest("3.0", "POST", "purchase/expenses", undefined, data);
  }

  async updateExpense(expenseId: string, data: Record<string, unknown>): Promise<unknown> {
    return this.makeVersionedRequest("3.0", "PUT", `purchase/expenses/${expenseId}`, undefined, data);
  }

  async deleteExpense(expenseId: string): Promise<unknown> {
    return this.makeVersionedRequest("3.0", "DELETE", `purchase/expenses/${expenseId}`);
  }

  // ===== PURCHASE ORDERS (PURCH-03, v3.0 API) =====
  async listPurchaseOrders(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeVersionedRequest("3.0", "GET", "purchase_orders", params);
  }

  async getPurchaseOrder(purchaseOrderId: number): Promise<unknown> {
    return this.makeVersionedRequest("3.0", "GET", `purchase_orders/${purchaseOrderId}`);
  }

  async createPurchaseOrder(data: Record<string, unknown>): Promise<unknown> {
    return this.makeVersionedRequest("3.0", "POST", "purchase_orders", undefined, data);
  }

  async updatePurchaseOrder(purchaseOrderId: number, data: Record<string, unknown>): Promise<unknown> {
    return this.makeVersionedRequest("3.0", "PUT", `purchase_orders/${purchaseOrderId}`, undefined, data);
  }

  async deletePurchaseOrder(purchaseOrderId: number): Promise<unknown> {
    return this.makeVersionedRequest("3.0", "DELETE", `purchase_orders/${purchaseOrderId}`);
  }

  // ===== OUTGOING PAYMENTS (PURCH-04, v4.0 API, requires bill_id) =====
  async listOutgoingPayments(params: PaginationParams = {}, billId?: string): Promise<unknown[]> {
    const queryParams: Record<string, unknown> = { ...params };
    if (billId) {
      queryParams.bill_id = billId;
    }
    return this.makeVersionedRequest("4.0", "GET", "purchase/outgoing-payments", queryParams);
  }

  async getOutgoingPayment(paymentId: string): Promise<unknown> {
    return this.makeVersionedRequest("4.0", "GET", `purchase/outgoing-payments/${paymentId}`);
  }

  async createOutgoingPayment(paymentData: Record<string, unknown>): Promise<unknown> {
    return this.makeVersionedRequest("4.0", "POST", "purchase/outgoing-payments", undefined, paymentData);
  }

  async updateOutgoingPayment(paymentId: string, paymentData: Record<string, unknown>): Promise<unknown> {
    return this.makeVersionedRequest("4.0", "PUT", `purchase/outgoing-payments/${paymentId}`, undefined, paymentData);
  }

  async deleteOutgoingPayment(paymentId: string): Promise<unknown> {
    return this.makeVersionedRequest("4.0", "DELETE", `purchase/outgoing-payments/${paymentId}`);
  }

  // ===== EMPLOYEES (PAY-01) =====
  // Note: Payroll module may not be enabled - handlers check availability
  async listEmployees(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeRequest("GET", "/employee", params);
  }

  async getEmployee(employeeId: number): Promise<unknown> {
    return this.makeRequest("GET", `/employee/${employeeId}`);
  }

  async createEmployee(data: Record<string, unknown>): Promise<unknown> {
    return this.makeRequest("POST", "/employee", undefined, data);
  }

  async updateEmployee(employeeId: number, data: Record<string, unknown>): Promise<unknown> {
    return this.makeRequest("POST", `/employee/${employeeId}`, undefined, data);
  }

  // ===== ABSENCES (PAY-02) =====
  async listAbsences(params: PaginationParams & { year?: number } = {}): Promise<unknown[]> {
    return this.makeRequest("GET", "/absence", params);
  }

  async getAbsence(absenceId: number): Promise<unknown> {
    return this.makeRequest("GET", `/absence/${absenceId}`);
  }

  async createAbsence(data: Record<string, unknown>): Promise<unknown> {
    return this.makeRequest("POST", "/absence", undefined, data);
  }

  async updateAbsence(absenceId: number, data: Record<string, unknown>): Promise<unknown> {
    return this.makeRequest("POST", `/absence/${absenceId}`, undefined, data);
  }

  async deleteAbsence(absenceId: number): Promise<unknown> {
    return this.makeRequest("DELETE", `/absence/${absenceId}`);
  }

  // ===== PAYROLL DOCUMENTS (PAY-03) =====
  async listPayrollDocuments(params: PaginationParams & { employee_id?: number } = {}): Promise<unknown[]> {
    return this.makeRequest("GET", "/payroll_document", params);
  }

  // ===== FILES (FILE-01, v3.0 API) =====
  async listFiles(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeVersionedRequest("3.0", "GET", "files", params);
  }

  async getFile(fileId: number): Promise<unknown> {
    return this.makeVersionedRequest("3.0", "GET", `files/${fileId}`);
  }

  async uploadFile(data: { name: string; content_base64: string; content_type: string }): Promise<unknown> {
    const buffer = Buffer.from(data.content_base64, "base64");
    // Use Node.js built-in FormData (Node 18+) for multipart upload
    const blob = new Blob([buffer], { type: data.content_type });
    const formData = new FormData();
    formData.append("file", blob, data.name);
    const url = "https://api.bexio.com/3.0/files";
    return axios.post(url, formData, {
      headers: {
        Authorization: `Bearer ${this.config.apiToken}`,
      },
    }).then(r => r.data);
  }

  async downloadFile(fileId: number): Promise<string> {
    const url = `https://api.bexio.com/3.0/files/${fileId}/download`;
    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${this.config.apiToken}`,
        Accept: "application/json",
      },
      responseType: "arraybuffer",
    });
    return Buffer.from(response.data).toString("base64");
  }

  async updateFile(fileId: number, data: Record<string, unknown>): Promise<unknown> {
    return this.makeVersionedRequest("3.0", "POST", `files/${fileId}`, undefined, data);
  }

  async deleteFile(fileId: number): Promise<unknown> {
    return this.makeVersionedRequest("3.0", "DELETE", `files/${fileId}`);
  }

  // ===== ADDITIONAL ADDRESSES (FILE-02) =====
  async listAdditionalAddresses(contactId: number, params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeRequest("GET", `/contact/${contactId}/additional_address`, params);
  }

  async getAdditionalAddress(contactId: number, addressId: number): Promise<unknown> {
    return this.makeRequest("GET", `/contact/${contactId}/additional_address/${addressId}`);
  }

  async createAdditionalAddress(contactId: number, data: Record<string, unknown>): Promise<unknown> {
    return this.makeRequest("POST", `/contact/${contactId}/additional_address`, undefined, data);
  }

  async updateAdditionalAddress(contactId: number, addressId: number, data: Record<string, unknown>): Promise<unknown> {
    return this.makeRequest("PUT", `/contact/${contactId}/additional_address/${addressId}`, undefined, data);
  }

  async searchAdditionalAddresses(contactId: number, criteria: SearchCriteria[], limit = 50): Promise<unknown[]> {
    return this.makeRequest("POST", `/contact/${contactId}/additional_address/search`, { limit }, criteria);
  }

  async deleteAdditionalAddress(contactId: number, addressId: number): Promise<unknown> {
    return this.makeRequest("DELETE", `/contact/${contactId}/additional_address/${addressId}`);
  }

  // ===== NOTES (NOTES-01) =====
  async listAllNotes(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeRequest("GET", "/note", params);
  }

  async listNotes(resourceType: string, resourceId: number, params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeRequest("GET", "/note", {
      ...params,
      event_module: resourceType,
      event_module_id: resourceId,
    });
  }

  async getNote(noteId: number): Promise<unknown> {
    return this.makeRequest("GET", `/note/${noteId}`);
  }

  async createNote(data: {
    user_id: number;
    event_start: string;
    subject: string;
    info?: string;
    is_public?: boolean;
    contact_id?: number;
    pr_project_id?: number;
  }): Promise<unknown> {
    return this.makeRequest("POST", "/note", undefined, data);
  }

  async updateNote(noteId: number, data: Record<string, unknown>): Promise<unknown> {
    return this.makeRequest("PUT", `/note/${noteId}`, undefined, data);
  }

  async deleteNote(noteId: number): Promise<unknown> {
    return this.makeRequest("DELETE", `/note/${noteId}`);
  }

  async searchNotes(criteria: Record<string, unknown>[], params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeRequest("POST", "/note/search", params, criteria);
  }

  // ===== TASKS (TASKS-01, TASKS-02) =====
  async listTasks(params: Record<string, unknown> = {}): Promise<unknown[]> {
    return this.makeRequest("GET", "/task", params);
  }

  async getTask(taskId: number): Promise<unknown> {
    return this.makeRequest("GET", `/task/${taskId}`);
  }

  async createTask(data: Record<string, unknown>): Promise<unknown> {
    return this.makeRequest("POST", "/task", undefined, data);
  }

  async updateTask(taskId: number, data: Record<string, unknown>): Promise<unknown> {
    return this.makeRequest("POST", `/task/${taskId}`, undefined, data);
  }

  async deleteTask(taskId: number): Promise<unknown> {
    return this.makeRequest("DELETE", `/task/${taskId}`);
  }

  async searchTasks(criteria: Record<string, unknown>[], params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeRequest("POST", "/task/search", params, criteria);
  }

  async listTaskPriorities(): Promise<unknown[]> {
    return this.makeRequest("GET", "/todo_priority");
  }

  async listTaskStatuses(): Promise<unknown[]> {
    return this.makeRequest("GET", "/todo_status");
  }

  // ===== STOCK LOCATIONS (STOCK-01, API uses "stock_place") =====
  async listStockLocations(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeRequest("GET", "/stock_place", params);
  }

  async searchStockLocations(criteria: SearchCriteria[], limit = 100): Promise<unknown[]> {
    return this.makeRequest("POST", "/stock_place/search", { limit }, criteria);
  }

  // ===== STOCK AREAS (STOCK-02, API uses "stock") =====
  async listStockAreas(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeRequest("GET", "/stock", params);
  }

  async searchStockAreas(criteria: SearchCriteria[], limit = 100): Promise<unknown[]> {
    return this.makeRequest("POST", "/stock/search", { limit }, criteria);
  }

  // ===== DOCUMENT SETTINGS (DOCS-01, API uses "kb_item_setting") =====
  async listDocumentSettings(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeRequest("GET", "/kb_item_setting", params);
  }

  // ===== DOCUMENT TEMPLATES (DOCS-02, v3.0 API) =====
  async listDocumentTemplates(params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeVersionedRequest("3.0", "GET", "document_templates", params);
  }

  // ===== POSITIONS (POS-01 through POS-07) =====

  async listPositions(documentType: string, documentId: number, positionType: string, params: PaginationParams = {}): Promise<unknown[]> {
    return this.makeRequest("GET", `/${documentType}/${documentId}/${positionType}`, params);
  }

  async getPosition(documentType: string, documentId: number, positionType: string, positionId: number): Promise<unknown> {
    return this.makeRequest("GET", `/${documentType}/${documentId}/${positionType}/${positionId}`);
  }

  async createPosition(documentType: string, documentId: number, positionType: string, data: Record<string, unknown>): Promise<unknown> {
    return this.makeRequest("POST", `/${documentType}/${documentId}/${positionType}`, undefined, data);
  }

  async createPositionWithoutBody(documentType: string, documentId: number, positionType: string): Promise<unknown> {
    return this.makeRequest("POST", `/${documentType}/${documentId}/${positionType}`);
  }

  async editPosition(documentType: string, documentId: number, positionType: string, positionId: number, data: Record<string, unknown>): Promise<unknown> {
    return this.makeRequest("POST", `/${documentType}/${documentId}/${positionType}/${positionId}`, undefined, data);
  }

  async deletePosition(documentType: string, documentId: number, positionType: string, positionId: number): Promise<unknown> {
    return this.makeRequest("DELETE", `/${documentType}/${documentId}/${positionType}/${positionId}`);
  }
}
