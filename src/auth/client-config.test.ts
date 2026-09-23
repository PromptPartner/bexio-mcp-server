import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { ClientRegistry, generateClientKey, hashClientKey, parseClientsConfig } from "./client-config.js";

const dirs: string[] = [];
afterEach(() => {
  for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

function writeClients(content: unknown): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bmg-clients-"));
  dirs.push(dir);
  const file = path.join(dir, "clients.json");
  fs.writeFileSync(file, JSON.stringify(content));
  return file;
}

describe("parseClientsConfig", () => {
  const hash = hashClientKey("k");

  it("accepts a valid config", () => {
    expect(parseClientsConfig(JSON.stringify({ anna: { keyHash: hash, connection: "backoffice" } }))).toEqual([
      { name: "anna", keyHash: hash, connection: "backoffice", disabled: false },
    ]);
  });

  it.each([
    ["not json", "{", /not valid JSON/],
    ["array", "[]", /must be an object/],
    ["bad hash", JSON.stringify({ anna: { keyHash: "abc", connection: "backoffice" } }), /keyHash/],
    ["bad label", JSON.stringify({ anna: { keyHash: hash, connection: "Back Office" } }), /connection/],
    ["bad name", JSON.stringify({ "an na": { keyHash: hash, connection: "backoffice" } }), /client name/],
    [
      "duplicate key",
      JSON.stringify({ anna: { keyHash: hash, connection: "backoffice" }, ben: { keyHash: hash, connection: "backoffice" } }),
      /reuses the key/,
    ],
  ])("rejects %s", (_, json, error) => {
    expect(() => parseClientsConfig(json)).toThrow(error);
  });
});

describe("ClientRegistry", () => {
  it("authenticates by key and honours disabled entries", () => {
    const anna = generateClientKey();
    const ben = generateClientKey();
    const file = writeClients({
      anna: { keyHash: hashClientKey(anna), connection: "backoffice" },
      ben: { keyHash: hashClientKey(ben), connection: "ben", disabled: true },
    });
    const registry = new ClientRegistry(file);

    expect(registry.authenticate(anna)).toEqual({ name: "anna", connection: "backoffice" });
    expect(registry.authenticate(ben)).toBeUndefined();
    expect(registry.authenticate("bmg_wrong")).toBeUndefined();
    expect(registry.isActive("anna")).toBe(true);
    expect(registry.isActive("ben")).toBe(false);
  });

  it("reloads on change and keeps the last valid config on errors", () => {
    const anna = generateClientKey();
    const file = writeClients({ anna: { keyHash: hashClientKey(anna), connection: "backoffice" } });
    const registry = new ClientRegistry(file);
    expect(registry.authenticate(anna)).toBeDefined();

    const later = new Date(Date.now() + 5_000);
    fs.writeFileSync(file, "{ broken");
    fs.utimesSync(file, later, later);
    expect(registry.authenticate(anna)).toBeDefined();

    const evenLater = new Date(Date.now() + 10_000);
    fs.writeFileSync(file, JSON.stringify({}));
    fs.utimesSync(file, evenLater, evenLater);
    expect(registry.authenticate(anna)).toBeUndefined();
  });
});
