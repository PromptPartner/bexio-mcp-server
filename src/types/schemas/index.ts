/**
 * Barrel export for all domain schemas.
 * Import from this file for easy access to all schemas.
 */

// Contacts
export * from "./contacts.js";

// Invoices
export * from "./invoices.js";

// Orders
export * from "./orders.js";

// Quotes
export * from "./quotes.js";

// Payments
export * from "./payments.js";

// Reminders
export * from "./reminders.js";

// Deliveries
export * from "./deliveries.js";

// Items and Taxes
export * from "./items.js";

// Reports
export * from "./reports.js";

// Users
export * from "./users.js";

// Misc (Comments, Contact Relations)
export * from "./misc.js";

// Reference Data (Contact Groups, Sectors, Salutations, Titles, Countries, Languages, Units)
export * from "./reference.js";

// Company (Company Profile, Permissions, Payment Types)
export * from "./company.js";

// Banking (Bank Accounts, Currencies, IBAN Payments, QR Payments)
export * from "./banking.js";

// Projects (Projects, Project Types, Project Statuses)
export * from "./projects.js";

// Time Tracking (Timesheets, Statuses, Business Activities, Communication Types)
export * from "./timetracking.js";

// Accounting (Accounts, Account Groups, Years, Manual Entries, VAT, Journal)
export * from "./accounting.js";

// Purchase (Bills, Expenses)
export * from "./purchase.js";

// Files (Files, Additional Addresses)
export * from "./files.js";

// Payroll (Employees, Absences, Payroll Documents - conditional module)
export * from "./payroll.js";

// Notes (Notes attached to contacts, invoices, quotes, orders, etc.)
export * from "./notes.js";

// Tasks (Task management with optional resource linking)
export * from "./tasks.js";

// Stock (Stock Locations, Stock Areas)
export * from "./stock.js";

// Document Settings (Document Settings, Document Templates)
export * from "./docs.js";

// Positions (Default, Item, Text, Subtotal, Discount, Pagebreak, Sub positions on sales documents)
export * from "./positions.js";

// Companies (multi-company / mandate switching — v2.5.0)
export * from "./companies.js";
