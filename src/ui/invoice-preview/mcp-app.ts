import { App } from "@modelcontextprotocol/ext-apps";
import { esc } from "../shared/esc.js";

interface InvoicePosition {
  text: string;
  amount: number;
  unit_price: number;
  discount_in_percent?: number;
}

interface Invoice {
  id: number;
  document_nr: string;
  title: string | null;
  contact_id: number;
  contact_sub_id: number | null;
  user_id: number;
  pr_project_id: number | null;
  language_id: number;
  bank_account_id: number;
  currency_id: number;
  payment_type_id: number;
  header: string | null;
  footer: string | null;
  total_gross: string;
  total_net: string;
  total_taxes: string;
  total: string;
  mwst_type: number;
  mwst_is_net: boolean;
  show_position_taxes: boolean;
  is_valid_from: string;
  is_valid_to: string;
  contact_address: string;
  kb_item_status_id: number;
  api_reference: string | null;
  viewed_by_client_at: string | null;
  updated_at: string;
  esr_id: number;
  qr_invoice_id: number;
  positions?: InvoicePosition[];
}

const appEl = document.getElementById("app")!;

const app = new App({ name: "Invoice Preview", version: "1.0.0" });

app.ontoolresult = (result) => {
  const text = result.content?.find((c: { type: string }) => c.type === "text")?.text;
  if (text) {
    try {
      const invoice = JSON.parse(text) as Invoice;
      renderInvoice(invoice);
    } catch (e) {
      appEl.innerHTML = `<div class="loading">Error parsing invoice data</div>`;
    }
  }
};

app.connect();

function getStatusInfo(statusId: number): { label: string; className: string } {
  switch (statusId) {
    case 7: return { label: "Draft", className: "status-draft" };
    case 8: return { label: "Pending", className: "status-pending" };
    case 9: return { label: "Sent", className: "status-sent" };
    case 16: return { label: "Paid", className: "status-paid" };
    case 17: return { label: "Overdue", className: "status-overdue" };
    case 19: return { label: "Cancelled", className: "status-cancelled" };
    default: return { label: `Status ${statusId}`, className: "status-draft" };
  }
}

function formatCurrency(amount: string | number, currencyId: number): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  const currency = currencyId === 1 ? "CHF" : currencyId === 2 ? "EUR" : "USD";
  return `${currency} ${value.toFixed(2)}`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("de-CH", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function renderInvoice(invoice: Invoice) {
  const status = getStatusInfo(invoice.kb_item_status_id);
  const positions = invoice.positions || [];

  appEl.className = "invoice";
  appEl.innerHTML = `
    <div class="header">
      <div class="header-left">
        <h1>Invoice ${esc(invoice.document_nr)}</h1>
        <p class="title">${esc(invoice.title)}</p>
      </div>
      <div class="header-right">
        <div class="dates">
          <div>Issue: ${esc(formatDate(invoice.is_valid_from))}</div>
          <div>Due: ${esc(formatDate(invoice.is_valid_to))}</div>
        </div>
        <span class="status-badge ${status.className}">${esc(status.label)}</span>
      </div>
    </div>

    <div class="contact-section">
      <h2>Bill To</h2>
      <div class="name">${esc(invoice.contact_address?.split("\n")[0] || `Contact #${invoice.contact_id}`)}</div>
      <div class="email">${esc(invoice.contact_address?.split("\n").slice(1).join(", "))}</div>
    </div>

    <table class="line-items">
      <thead>
        <tr>
          <th>Description</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        ${positions.length > 0 ? positions.map((p) => `
          <tr>
            <td>${esc(p.text)}</td>
            <td>${esc(p.amount)}</td>
            <td>${esc(formatCurrency(p.unit_price, invoice.currency_id))}</td>
            <td>${esc(formatCurrency(p.amount * p.unit_price * (1 - (p.discount_in_percent || 0) / 100), invoice.currency_id))}</td>
          </tr>
        `).join("") : `
          <tr>
            <td colspan="4" style="text-align: center; color: #6b7280;">No line items available</td>
          </tr>
        `}
      </tbody>
    </table>

    <div class="total-section">
      <div class="total-row">
        <span class="total-label">Total:</span>
        <span class="total-amount">${esc(formatCurrency(invoice.total_gross, invoice.currency_id))}</span>
      </div>
    </div>
  `;
}
