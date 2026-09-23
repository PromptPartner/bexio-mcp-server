import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { decrypt, encrypt, parseEncryptionKey } from "./crypto.js";
import { ConnectionStore, type StoredConnection } from "./token-store.js";

const KEY_A = parseEncryptionKey("a".repeat(64));
const KEY_B = parseEncryptionKey("b".repeat(64));

const dirs: string[] = [];
function tempFile(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "bmg-store-"));
  dirs.push(dir);
  return path.join(dir, "connections.enc");
}
afterEach(() => {
  for (const dir of dirs.splice(0)) fs.rmSync(dir, { recursive: true, force: true });
});

const connection: StoredConnection = {
  label: "backoffice",
  accessToken: "access-secret",
  refreshToken: "refresh-secret",
  accessTokenExpiresAt: 1,
  connectedAt: 1,
  lastRefreshAt: 1,
  status: "active",
  companyName: "Monswyk AG",
};

describe("crypto", () => {
  it("round-trips and rejects a wrong key", () => {
    const sealed = encrypt("hello", KEY_A);
    expect(decrypt(sealed, KEY_A)).toBe("hello");
    expect(() => decrypt(sealed, KEY_B)).toThrow();
  });

  it("rejects malformed keys", () => {
    expect(() => parseEncryptionKey("abc")).toThrow(/64 hex/);
  });
});

describe("ConnectionStore", () => {
  it("persists connections encrypted and reloads them", () => {
    const file = tempFile();
    new ConnectionStore(file, KEY_A).upsert(connection);

    const raw = fs.readFileSync(file, "utf8");
    expect(raw).not.toContain("refresh-secret");
    expect(raw).not.toContain("Monswyk");

    const reloaded = new ConnectionStore(file, KEY_A);
    expect(reloaded.get("backoffice")).toEqual(connection);
    expect(reloaded.list()).toHaveLength(1);
  });

  it("refuses to start with a different key", () => {
    const file = tempFile();
    new ConnectionStore(file, KEY_A).upsert(connection);
    expect(() => new ConnectionStore(file, KEY_B)).toThrow(/Cannot decrypt/);
  });

  it("removes connections and leaves no temp file behind", () => {
    const file = tempFile();
    const store = new ConnectionStore(file, KEY_A);
    store.upsert(connection);
    expect(store.remove("backoffice")).toBe(true);
    expect(store.remove("backoffice")).toBe(false);
    expect(fs.existsSync(`${file}.tmp`)).toBe(false);
    expect(new ConnectionStore(file, KEY_A).list()).toEqual([]);
  });
});
