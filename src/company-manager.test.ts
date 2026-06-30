import { describe, it, expect } from "vitest";
import { parseCompanyTokens, CompanyManager } from "./company-manager.js";

describe("parseCompanyTokens", () => {
  it("parses the JSON object form, preserving order", () => {
    const out = parseCompanyTokens({ BEXIO_API_TOKENS: '{"Acme":"t1","Globex":"t2"}' });
    expect(out).toEqual([
      { label: "Acme", token: "t1" },
      { label: "Globex", token: "t2" },
    ]);
  });

  it("parses the delimited label:token,label:token form and trims whitespace", () => {
    const out = parseCompanyTokens({ BEXIO_API_TOKENS: "Acme:t1, Globex:t2" });
    expect(out).toEqual([
      { label: "Acme", token: "t1" },
      { label: "Globex", token: "t2" },
    ]);
  });

  it("keeps dotted JWT-style tokens intact (only the first colon splits)", () => {
    const out = parseCompanyTokens({ BEXIO_API_TOKENS: "Main:eyJ.abc.def" });
    expect(out).toEqual([{ label: "Main", token: "eyJ.abc.def" }]);
  });

  it("falls back to a single BEXIO_API_TOKEN as 'default'", () => {
    expect(parseCompanyTokens({ BEXIO_API_TOKEN: "solo" })).toEqual([
      { label: "default", token: "solo" },
    ]);
  });

  it("labels a single token with BEXIO_DEFAULT_COMPANY when given", () => {
    expect(parseCompanyTokens({ BEXIO_API_TOKEN: "solo", BEXIO_DEFAULT_COMPANY: "Acme" })).toEqual([
      { label: "Acme", token: "solo" },
    ]);
  });

  it("does not duplicate a single token already present in BEXIO_API_TOKENS", () => {
    expect(parseCompanyTokens({ BEXIO_API_TOKENS: "A:t1", BEXIO_API_TOKEN: "t1" })).toEqual([
      { label: "A", token: "t1" },
    ]);
  });

  it("ignores malformed pairs and returns [] for empty env", () => {
    expect(parseCompanyTokens({ BEXIO_API_TOKENS: "noColonHere" })).toEqual([]);
    expect(parseCompanyTokens({})).toEqual([]);
  });
});

describe("CompanyManager", () => {
  const cfg = (defaultCompany?: string) => ({
    baseUrl: "https://api.bexio.com/2.0",
    tokens: [
      { label: "Acme", token: "t1" },
      { label: "Globex", token: "t2" },
    ],
    defaultCompany,
  });

  it("defaults the active company to the first configured one", () => {
    const m = new CompanyManager();
    m.init(cfg());
    expect(m.getActiveLabel()).toBe("Acme");
    expect(m.labels()).toEqual(["Acme", "Globex"]);
    expect(m.hasMultiple()).toBe(true);
  });

  it("honors BEXIO_DEFAULT_COMPANY when valid, else first", () => {
    const m = new CompanyManager();
    m.init(cfg("Globex"));
    expect(m.getActiveLabel()).toBe("Globex");
    const m2 = new CompanyManager();
    m2.init(cfg("Nope"));
    expect(m2.getActiveLabel()).toBe("Acme");
  });

  it("selectCompany switches the active label; unknown labels throw with the available list", () => {
    const m = new CompanyManager();
    m.init(cfg());
    expect(m.selectCompany("Globex").active).toBe("Globex");
    expect(m.getActiveLabel()).toBe("Globex");
    expect(() => m.selectCompany("Zzz")).toThrow(/Acme/);
  });

  it("getActiveClient returns a usable client and single-token mode reports hasMultiple=false", () => {
    const m = new CompanyManager();
    m.init({ baseUrl: "https://api.bexio.com/2.0", tokens: [{ label: "default", token: "solo" }] });
    expect(typeof m.getActiveClient().getCompanyProfile).toBe("function");
    expect(m.hasMultiple()).toBe(false);
  });

  it("throws if no tokens are configured", () => {
    const m = new CompanyManager();
    expect(() => m.init({ baseUrl: "x", tokens: [] })).toThrow();
  });
});
