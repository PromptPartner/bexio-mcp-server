#!/usr/bin/env node
/**
 * Live verification of the v2.5.0 multi-company feature through the REAL built
 * companyManager + companies handlers. With only one test token available, we
 * configure TWO labels pointing at it ("Primary" + "Secondary") to exercise the
 * switch mechanism end-to-end — the routing code path is identical regardless of
 * which token each label holds. Read-only; nothing is created. Run from src/ after
 * build: node scripts/verify-multicompany.mjs
 */
import fs from "node:fs";
import { companyManager } from "../dist/company-manager.js";
import { handlers as companies } from "../dist/tools/companies/index.js";

const token = (fs.readFileSync(".env", "utf8").match(/BEXIO_API_TOKEN=(.+)/) || [])[1]?.trim();
if (!token) { console.error("No token"); process.exit(1); }

let pass = 0, fail = 0;
const check = (n, c, e = "") => { if (c) { pass++; console.log(`  PASS  ${n}  ${e}`); } else { fail++; console.log(`  FAIL  ${n}  ${e}`); } };

companyManager.init({
  baseUrl: "https://api.bexio.com/2.0",
  tokens: [{ label: "Primary", token }, { label: "Secondary", token }],
  defaultCompany: "Primary",
});

// default active = Primary
check("default active company = Primary", companyManager.getActiveLabel() === "Primary", `active=${companyManager.getActiveLabel()}`);
check("hasMultiple() true with 2 companies", companyManager.hasMultiple() === true);

// list_companies through the handler — both labels, real company name, active flag
const listed = await companies.list_companies(companyManager.getActiveClient(), {});
const arr = listed.companies;
check("list_companies returns both labels", arr.length === 2 && arr[0].label === "Primary" && arr[1].label === "Secondary");
check("list_companies marks Primary active", arr[0].active === true && arr[1].active === false);
check("list_companies resolved a real company name", typeof arr[0].company_name === "string" && arr[0].company_name.length > 0, `name=${arr[0].company_name}`);
check("NO TOKEN LEAK in list_companies output", !JSON.stringify(listed).includes(token));

// select_company switches the active company
const sel = await companies.select_company(companyManager.getActiveClient(), { company: "Secondary" });
check("select_company switches active to Secondary", sel.active === "Secondary" && companyManager.getActiveLabel() === "Secondary", sel.message);

// a real tool routed through the now-active client works
const profile = await companyManager.getActiveClient().getCompanyProfile();
check("active client routes a real API call (company_profile)", !!profile, `profile keys: ${Object.keys(Array.isArray(profile) ? (profile[0] ?? {}) : (profile ?? {})).slice(0,3).join(",")}`);

// unknown label → validation error listing available companies
let threw = false, msg = "";
try { await companies.select_company(companyManager.getActiveClient(), { company: "DoesNotExist" }); }
catch (e) { threw = true; msg = e?.message ?? String(e); }
check("select_company rejects unknown label with available list", threw && /Primary/.test(msg) && /Secondary/.test(msg));

console.log(`\n=== RESULT: ${pass} passed, ${fail} failed ===`);
process.exit(fail === 0 ? 0 : 1);
