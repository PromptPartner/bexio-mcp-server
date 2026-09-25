import { App } from "@modelcontextprotocol/ext-apps";
import { esc } from "../shared/esc.js";

interface RecentContact {
  id: number;
  name_1: string;
  name_2: string | null;
}

interface DashboardData {
  open_invoices_count: number;
  open_invoices_total: number;
  overdue_count: number;
  overdue_total: number;
  recent_contacts: RecentContact[];
  currency: string;
}

const appEl = document.getElementById("app")!;

const app = new App({ name: "Bexio Dashboard", version: "1.0.0" });

app.ontoolresult = (result) => {
  const text = result.content?.find((c: { type: string }) => c.type === "text")?.text;
  if (text) {
    try {
      const data = JSON.parse(text) as DashboardData;
      renderDashboard(data);
    } catch (e) {
      appEl.innerHTML = `<div class="loading">Error parsing dashboard data</div>`;
    }
  }
};

app.connect();

function formatCurrency(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString("de-CH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function getInitials(name1: string, name2: string | null): string {
  const parts = [name1, name2].filter(Boolean);
  return parts.map(p => p!.charAt(0).toUpperCase()).join("").slice(0, 2) || "?";
}

function renderDashboard(data: DashboardData) {
  appEl.className = "dashboard";
  appEl.innerHTML = `
    <div class="header">
      <h1>Bexio Dashboard</h1>
      <p class="subtitle">Overview of your invoices and recent contacts</p>
    </div>

    <div class="grid">
      <div class="card">
        <div class="card-header">
          <div class="card-icon blue">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
          </div>
          <span class="card-title">Open Invoices</span>
        </div>
        <div class="card-value">${esc(data.open_invoices_count)}</div>
        <div class="card-subtitle">${esc(formatCurrency(data.open_invoices_total, data.currency))} total</div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-icon yellow">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <span class="card-title">Overdue</span>
        </div>
        <div class="card-value">${esc(data.overdue_count)}</div>
        <div class="card-subtitle">${esc(formatCurrency(data.overdue_total, data.currency))} outstanding</div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-icon green">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
          </div>
          <span class="card-title">Recent Contacts</span>
        </div>
        <div class="contacts-list">
          ${data.recent_contacts.length > 0 ? data.recent_contacts.slice(0, 5).map(contact => `
            <div class="contact-item">
              <div class="contact-avatar">${esc(getInitials(contact.name_1, contact.name_2))}</div>
              <span class="contact-name">${esc([contact.name_1, contact.name_2].filter(Boolean).join(" "))}</span>
            </div>
          `).join("") : `
            <div class="empty-state">No recent contacts</div>
          `}
        </div>
      </div>
    </div>
  `;
}
