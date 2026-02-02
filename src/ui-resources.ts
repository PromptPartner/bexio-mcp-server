/**
 * MCP Apps UI Resources Registration.
 *
 * Registers UI tools and resources for interactive invoice preview,
 * contact card, and dashboard summary.
 *
 * Uses @modelcontextprotocol/ext-apps SDK for UI resource handling.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  registerAppTool,
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";
import fs from "node:fs/promises";
import path from "node:path";
import { BexioClient } from "./bexio-client.js";
import { logger } from "./logger.js";

// UI Resource URIs using ui:// scheme
const INVOICE_PREVIEW_URI = "ui://bexio/invoice-preview.html";
const CONTACT_CARD_URI = "ui://bexio/contact-card.html";
const DASHBOARD_URI = "ui://bexio/dashboard.html";

/**
 * Register MCP Apps UI resources and tools.
 *
 * @param server - McpServer instance
 * @param client - BexioClient for API calls
 */
export function registerUIResources(server: McpServer, client: BexioClient): void {
  const uiBasePath = path.join(import.meta.dirname, "../dist/ui");

  // ===== INVOICE PREVIEW =====
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (registerAppTool as any)(
    server,
    "preview_invoice",
    {
      title: "Preview Invoice",
      description: "Display an interactive invoice preview with line items, totals, and status",
      inputSchema: { invoice_id: z.number().int().describe("The invoice ID to preview") },
      _meta: { ui: { resourceUri: INVOICE_PREVIEW_URI } },
    },
    async (args: { invoice_id: number }) => {
      const invoiceId = args.invoice_id;
      logger.debug(`preview_invoice called for invoice ${invoiceId}`);
      const invoice = await client.getInvoice(invoiceId);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(invoice) }],
      };
    }
  );

  registerAppResource(
    server,
    INVOICE_PREVIEW_URI,
    INVOICE_PREVIEW_URI,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => {
      const html = await fs.readFile(
        path.join(uiBasePath, "invoice-preview.html"),
        "utf-8"
      );
      return {
        contents: [{ uri: INVOICE_PREVIEW_URI, mimeType: RESOURCE_MIME_TYPE, text: html }],
      };
    }
  );

  // ===== CONTACT CARD =====
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (registerAppTool as any)(
    server,
    "show_contact_card",
    {
      title: "Show Contact Card",
      description: "Display a formatted contact card with name, contact details, and address",
      inputSchema: { contact_id: z.number().int().describe("The contact ID to display") },
      _meta: { ui: { resourceUri: CONTACT_CARD_URI } },
    },
    async (args: { contact_id: number }) => {
      const contactId = args.contact_id;
      logger.debug(`show_contact_card called for contact ${contactId}`);
      const contact = await client.getContact(contactId);
      return {
        content: [{ type: "text" as const, text: JSON.stringify(contact) }],
      };
    }
  );

  registerAppResource(
    server,
    CONTACT_CARD_URI,
    CONTACT_CARD_URI,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => {
      const html = await fs.readFile(
        path.join(uiBasePath, "contact-card.html"),
        "utf-8"
      );
      return {
        contents: [{ uri: CONTACT_CARD_URI, mimeType: RESOURCE_MIME_TYPE, text: html }],
      };
    }
  );

  // ===== DASHBOARD =====
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (registerAppTool as any)(
    server,
    "show_dashboard",
    {
      title: "Show Dashboard",
      description: "Display a summary dashboard with open invoices, overdue amounts, and recent contacts",
      _meta: { ui: { resourceUri: DASHBOARD_URI } },
    },
    async () => {
      logger.debug("show_dashboard called");

      // Fetch dashboard data
      const [openInvoices, overdueInvoices, contacts] = await Promise.all([
        client.getOpenInvoices(),
        client.getOverdueInvoices(),
        client.listContacts({ limit: 5 }),
      ]);

      // Calculate totals
      const openTotal = openInvoices.reduce((sum: number, inv) => {
        const total = parseFloat((inv as { total_gross?: string }).total_gross || "0");
        return sum + total;
      }, 0);

      const overdueTotal = overdueInvoices.reduce((sum: number, inv) => {
        const total = parseFloat((inv as { total_gross?: string }).total_gross || "0");
        return sum + total;
      }, 0);

      // Get currency from first invoice or default to CHF
      const firstInvoice = openInvoices[0] as { currency_id?: number } | undefined;
      const currencyId = firstInvoice?.currency_id || 1;
      const currency = currencyId === 1 ? "CHF" : currencyId === 2 ? "EUR" : "USD";

      // Format recent contacts
      const recentContacts = contacts.map((c) => {
        const contact = c as { id: number; name_1: string; name_2?: string | null };
        return {
          id: contact.id,
          name_1: contact.name_1,
          name_2: contact.name_2 || null,
        };
      });

      const dashboardData = {
        open_invoices_count: openInvoices.length,
        open_invoices_total: openTotal,
        overdue_count: overdueInvoices.length,
        overdue_total: overdueTotal,
        recent_contacts: recentContacts,
        currency,
      };

      return {
        content: [{ type: "text" as const, text: JSON.stringify(dashboardData) }],
      };
    }
  );

  registerAppResource(
    server,
    DASHBOARD_URI,
    DASHBOARD_URI,
    { mimeType: RESOURCE_MIME_TYPE },
    async () => {
      const html = await fs.readFile(
        path.join(uiBasePath, "dashboard.html"),
        "utf-8"
      );
      return {
        contents: [{ uri: DASHBOARD_URI, mimeType: RESOURCE_MIME_TYPE, text: html }],
      };
    }
  );

  logger.info("Registered 3 UI tools and 3 UI resources (MCP Apps)");
}
