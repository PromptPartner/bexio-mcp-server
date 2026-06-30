/**
 * Multi-company (mandate) control tool definitions (v2.5.0).
 * Registered only when BEXIO_API_TOKENS configures more than one company.
 */
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export const toolDefinitions: Tool[] = [
  {
    name: "list_companies",
    description:
      "List the Bexio companies (mandates) this server is configured for. Returns each company's label, its real company name, and which one is currently ACTIVE. Use this to discover the available companies before switching with select_company.",
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "select_company",
    description:
      "Switch the ACTIVE Bexio company (mandate). Every other tool operates on the active company, so call this first whenever the user refers to a specific company (e.g. \"in Globex, list open invoices\"). Pass the company's label exactly as shown by list_companies. The active company persists until you switch again.",
    annotations: { readOnlyHint: false },
    inputSchema: {
      type: "object",
      properties: {
        company: {
          type: "string",
          description: "The company label to activate, as shown by list_companies.",
        },
      },
      required: ["company"],
    },
  },
];
