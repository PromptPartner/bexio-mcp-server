import { App } from "@modelcontextprotocol/ext-apps";
import { esc } from "../shared/esc.js";

interface Contact {
  id: number;
  nr: string;
  contact_type_id: number;
  name_1: string;
  name_2: string | null;
  salutation_id: number | null;
  salutation_form: number | null;
  title_id: number | null;
  birthday: string | null;
  address: string | null;
  street_name?: string | null;
  house_number?: string | null;
  postcode: string | null;
  city: string | null;
  country_id: number | null;
  mail: string | null;
  mail_second: string | null;
  phone_fixed: string | null;
  phone_fixed_second: string | null;
  phone_mobile: string | null;
  fax: string | null;
  url: string | null;
  skype_name: string | null;
  remarks: string | null;
  language_id: number | null;
  is_lead: boolean;
  contact_group_ids: number[];
  contact_branch_ids: number[];
  user_id: number;
  owner_id: number;
  updated_at: string;
}

const appEl = document.getElementById("app")!;

const app = new App({ name: "Contact Card", version: "1.0.0" });

app.ontoolresult = (result) => {
  const text = result.content?.find((c: { type: string }) => c.type === "text")?.text;
  if (text) {
    try {
      const contact = JSON.parse(text) as Contact;
      renderContact(contact);
    } catch (e) {
      appEl.innerHTML = `<div class="loading">Error parsing contact data</div>`;
    }
  }
};

app.connect();

function getInitials(name1: string, name2: string | null): string {
  const parts = [name1, name2].filter(Boolean);
  return parts.map(p => p!.charAt(0).toUpperCase()).join("").slice(0, 2) || "?";
}

function getCountryName(countryId: number | null): string {
  const countries: Record<number, string> = {
    1: "Switzerland",
    2: "Germany",
    3: "Austria",
    4: "France",
    5: "Italy",
    6: "Liechtenstein",
  };
  return countryId ? countries[countryId] || `Country #${countryId}` : "";
}

function renderContact(contact: Contact) {
  const fullName = [contact.name_1, contact.name_2].filter(Boolean).join(" ");
  const initials = getInitials(contact.name_1, contact.name_2);
  const isCompany = contact.contact_type_id === 1;
  const typeBadge = isCompany ? "Company" : "Person";
  const typeClass = isCompany ? "type-company" : "type-person";

  // bexio's read-only `address` is built from street_name + house_number; compose it
  // ourselves when it is missing.
  const street = contact.address || [contact.street_name, contact.house_number].filter(Boolean).join(" ");
  const addressParts = [
    street,
    [contact.postcode, contact.city].filter(Boolean).join(" "),
    getCountryName(contact.country_id),
  ].filter(Boolean);

  const hasContactInfo = contact.mail || contact.phone_fixed || contact.phone_mobile || contact.fax;
  const hasAddress = addressParts.length > 0;

  appEl.className = "card";
  appEl.innerHTML = `
    <div class="card-header">
      <div class="avatar">${esc(initials)}</div>
      <h1>${esc(fullName)}</h1>
      ${contact.url ? `<div class="company">${esc(contact.url)}</div>` : ""}
      <span class="type-badge ${typeClass}">${typeBadge}</span>
    </div>
    <div class="card-body">
      ${hasContactInfo ? `
        <div class="info-section">
          <div class="info-label">Contact Information</div>
          ${contact.mail ? `
            <div class="info-row">
              <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              <span class="info-value"><a href="mailto:${esc(contact.mail)}">${esc(contact.mail)}</a></span>
            </div>
          ` : ""}
          ${contact.phone_fixed ? `
            <div class="info-row">
              <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
              </svg>
              <span class="info-value"><a href="tel:${esc(contact.phone_fixed)}">${esc(contact.phone_fixed)}</a></span>
            </div>
          ` : ""}
          ${contact.phone_mobile ? `
            <div class="info-row">
              <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
              </svg>
              <span class="info-value"><a href="tel:${esc(contact.phone_mobile)}">${esc(contact.phone_mobile)}</a></span>
            </div>
          ` : ""}
          ${contact.fax ? `
            <div class="info-row">
              <svg class="info-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"/>
              </svg>
              <span class="info-value">${esc(contact.fax)}</span>
            </div>
          ` : ""}
        </div>
      ` : ""}

      ${hasAddress ? `
        <div class="info-section">
          <div class="info-label">Address</div>
          <div class="address-block">
            ${addressParts.map(p => `<div>${esc(p)}</div>`).join("")}
          </div>
        </div>
      ` : ""}

      ${!hasContactInfo && !hasAddress ? `
        <div class="info-section" style="text-align: center; color: #6b7280;">
          No contact details available
        </div>
      ` : ""}
    </div>
  `;
}
