/**
 * Multi-company support (v2.5.0).
 *
 * Bexio binds every API token to a single company (mandate). To serve several
 * companies from ONE server instance, we hold a token per company and switch the
 * "active" one with the `select_company` tool. All other tools operate against
 * whatever company is active. Backward compatible: a single `BEXIO_API_TOKEN`
 * behaves exactly as before (one company labelled "default").
 *
 * SECURITY: tokens live only here and inside each BexioClient. They are never
 * logged or returned — `listCompanies()` exposes labels + company names only.
 */
import { BexioClient } from "./bexio-client.js";
import { logger } from "./logger.js";

export interface TokenEntry {
  label: string;
  token: string;
}

export interface CompanyInfo {
  label: string;
  active: boolean;
  company_name?: string;
}

export interface CompanyManagerConfig {
  baseUrl: string;
  tokens: TokenEntry[];
  defaultCompany?: string;
}

/**
 * Parse company tokens from env. Two `BEXIO_API_TOKENS` formats are accepted:
 *   JSON object: {"Acme":"<token>","Globex":"<token>"}
 *   Delimited:   Acme:<token>,Globex:<token>
 * A lone `BEXIO_API_TOKEN` is appended as `BEXIO_DEFAULT_COMPANY` (or "default")
 * unless that label/token is already present. Pure + unit-tested.
 */
export function parseCompanyTokens(env: Record<string, string | undefined>): TokenEntry[] {
  const out: TokenEntry[] = [];
  const multi = env["BEXIO_API_TOKENS"]?.trim();
  if (multi) {
    if (multi.startsWith("{")) {
      try {
        const obj = JSON.parse(multi) as Record<string, unknown>;
        for (const [label, token] of Object.entries(obj)) {
          const l = String(label).trim();
          const t = String(token).trim();
          if (l && t) out.push({ label: l, token: t });
        }
      } catch (e) {
        logger.error("BEXIO_API_TOKENS looked like JSON but failed to parse; ignoring it.");
      }
    } else {
      for (const pair of multi.split(",")) {
        const idx = pair.indexOf(":");
        if (idx === -1) continue; // skip malformed entries
        const label = pair.slice(0, idx).trim();
        const token = pair.slice(idx + 1).trim();
        if (label && token) out.push({ label, token });
      }
    }
  }
  const single = env["BEXIO_API_TOKEN"]?.trim();
  if (single) {
    const label = env["BEXIO_DEFAULT_COMPANY"]?.trim() || "default";
    if (!out.some((e) => e.label === label) && !out.some((e) => e.token === single)) {
      out.push({ label, token: single });
    }
  }
  return out;
}

interface Entry extends TokenEntry {
  client: BexioClient;
  companyName?: string;
}

export class CompanyManager {
  private entries = new Map<string, Entry>();
  private order: string[] = [];
  private activeLabel = "";
  private baseUrl = "https://api.bexio.com/2.0";

  init(config: CompanyManagerConfig): void {
    this.entries.clear();
    this.order = [];
    this.baseUrl = config.baseUrl;
    for (const { label, token } of config.tokens) {
      if (!label || !token) continue;
      if (this.entries.has(label)) {
        logger.warn(`Duplicate Bexio company label "${label}" ignored.`);
        continue;
      }
      this.entries.set(label, {
        label,
        token,
        client: new BexioClient({ baseUrl: this.baseUrl, apiToken: token }),
      });
      this.order.push(label);
    }
    if (this.order.length === 0) {
      throw new Error("No Bexio company tokens configured (set BEXIO_API_TOKEN or BEXIO_API_TOKENS).");
    }
    this.activeLabel =
      config.defaultCompany && this.entries.has(config.defaultCompany)
        ? config.defaultCompany
        : this.order[0]!;
    if (this.order.length > 1) {
      logger.info(`Multi-company mode: ${this.order.length} companies [${this.order.join(", ")}], active="${this.activeLabel}".`);
    }
  }

  getActiveClient(): BexioClient {
    const e = this.entries.get(this.activeLabel);
    if (!e) throw new Error("No active Bexio company.");
    return e.client;
  }

  getActiveLabel(): string {
    return this.activeLabel;
  }

  hasMultiple(): boolean {
    return this.order.length > 1;
  }

  labels(): string[] {
    return [...this.order];
  }

  selectCompany(label: string): { active: string; company_name?: string } {
    const e = this.entries.get(label);
    if (!e) {
      throw new Error(`Unknown company "${label}". Available companies: ${this.order.join(", ")}.`);
    }
    this.activeLabel = label;
    return { active: label, company_name: e.companyName };
  }

  /** Labels + active flag + (lazily fetched, cached) company names. No tokens. */
  async listCompanies(): Promise<CompanyInfo[]> {
    const out: CompanyInfo[] = [];
    for (const label of this.order) {
      const e = this.entries.get(label)!;
      if (e.companyName === undefined) {
        try {
          const profile = (await e.client.getCompanyProfile()) as unknown;
          e.companyName = extractCompanyName(profile);
        } catch {
          /* leave undefined — name is best-effort */
        }
      }
      out.push({ label, active: label === this.activeLabel, company_name: e.companyName });
    }
    return out;
  }
}

function extractCompanyName(profile: unknown): string | undefined {
  // Bexio /company_profile returns an object (or array of one) with a `name` field.
  const p = Array.isArray(profile) ? profile[0] : profile;
  if (p && typeof p === "object") {
    const rec = p as Record<string, unknown>;
    for (const k of ["name", "company_name", "name_1"]) {
      if (typeof rec[k] === "string" && rec[k]) return rec[k] as string;
    }
  }
  return undefined;
}

/** App-wide singleton (tests construct their own CompanyManager for isolation). */
export const companyManager = new CompanyManager();
