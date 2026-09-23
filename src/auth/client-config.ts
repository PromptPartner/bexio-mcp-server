/**
 * Gateway clients: one entry per person/machine that may use the MCP endpoint.
 *
 * clients.json maps a client name to the SHA-256 hash of its access key and the
 * Bexio connection it acts through:
 *
 *   { "anna": { "keyHash": "sha256:<hex>", "connection": "backoffice" } }
 *
 * Only hashes are stored, so the file itself cannot be used to log in. The file is
 * re-read when it changes, so adding or disabling a client needs no restart.
 */

import fs from "node:fs";
import { logger } from "../logger.js";
import { LABEL_PATTERN } from "./bexio-oidc.js";
import { randomToken, safeEqual, sha256Hex } from "./crypto.js";

export interface GatewayClient {
  name: string;
  connection: string;
}

interface ClientEntry {
  keyHash: string;
  connection: string;
  disabled?: boolean;
}

const NAME_PATTERN = /^[A-Za-z0-9._-]{1,64}$/;
const HASH_PATTERN = /^sha256:[0-9a-f]{64}$/;
const KEY_PREFIX = "bmg_";

export function generateClientKey(): string {
  return `${KEY_PREFIX}${randomToken(32)}`;
}

export function hashClientKey(key: string): string {
  return `sha256:${sha256Hex(key)}`;
}

interface ParsedClient extends GatewayClient {
  keyHash: string;
  disabled: boolean;
}

/** Parse and validate clients.json content. Throws with a readable message on any problem. */
export function parseClientsConfig(json: string): ParsedClient[] {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch (error) {
    throw new Error(`clients.json is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error('clients.json must be an object like {"anna": {"keyHash": "sha256:...", "connection": "backoffice"}}');
  }

  const clients: ParsedClient[] = [];
  const seenHashes = new Set<string>();
  for (const [name, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!NAME_PATTERN.test(name)) {
      throw new Error(`clients.json: invalid client name "${name}" (letters, digits, '.', '_', '-', max 64).`);
    }
    const entry = value as Partial<ClientEntry> | null;
    if (!entry || typeof entry !== "object") {
      throw new Error(`clients.json: entry "${name}" must be an object.`);
    }
    if (typeof entry.keyHash !== "string" || !HASH_PATTERN.test(entry.keyHash)) {
      throw new Error(`clients.json: "${name}".keyHash must look like "sha256:<64 hex chars>".`);
    }
    if (typeof entry.connection !== "string" || !LABEL_PATTERN.test(entry.connection)) {
      throw new Error(`clients.json: "${name}".connection must be a connection label like "backoffice".`);
    }
    if (seenHashes.has(entry.keyHash)) {
      throw new Error(`clients.json: "${name}" reuses the key of another client.`);
    }
    seenHashes.add(entry.keyHash);
    clients.push({
      name,
      keyHash: entry.keyHash,
      connection: entry.connection,
      disabled: entry.disabled === true,
    });
  }
  return clients;
}

export class ClientRegistry {
  private readonly filePath: string;
  private clients: ParsedClient[] = [];
  private loadedMtimeMs = -1;

  constructor(filePath: string) {
    this.filePath = filePath;
    this.clients = parseClientsConfig(fs.readFileSync(filePath, "utf8"));
    this.loadedMtimeMs = fs.statSync(filePath).mtimeMs;
    if (this.active().length === 0) {
      logger.warn(`${filePath} defines no enabled clients; nobody can use the MCP endpoint yet.`);
    }
  }

  /** Returns the client for a presented access key, or undefined. */
  authenticate(presentedKey: string): GatewayClient | undefined {
    this.reloadIfChanged();
    const presentedHash = hashClientKey(presentedKey);
    let match: ParsedClient | undefined;
    // Compare against every entry so timing does not reveal the position of a match.
    for (const client of this.clients) {
      if (safeEqual(client.keyHash, presentedHash)) match = client;
    }
    if (!match || match.disabled) return undefined;
    return { name: match.name, connection: match.connection };
  }

  /** Whether a client of this name is still configured and enabled. */
  isActive(name: string): boolean {
    this.reloadIfChanged();
    return this.clients.some((c) => c.name === name && !c.disabled);
  }

  list(): Array<GatewayClient & { disabled: boolean }> {
    this.reloadIfChanged();
    return this.clients.map(({ name, connection, disabled }) => ({ name, connection, disabled }));
  }

  private active(): ParsedClient[] {
    return this.clients.filter((c) => !c.disabled);
  }

  private reloadIfChanged(): void {
    let mtimeMs: number;
    try {
      mtimeMs = fs.statSync(this.filePath).mtimeMs;
    } catch {
      logger.error(`${this.filePath} disappeared; keeping the previously loaded clients.`);
      return;
    }
    if (mtimeMs === this.loadedMtimeMs) return;
    try {
      this.clients = parseClientsConfig(fs.readFileSync(this.filePath, "utf8"));
      this.loadedMtimeMs = mtimeMs;
      logger.info(`Reloaded ${this.filePath}: ${this.active().length} enabled client(s).`);
    } catch (error) {
      // Keep serving with the last valid config so a typo does not lock everyone out.
      logger.error(
        `Ignoring invalid ${this.filePath}:`,
        error instanceof Error ? error.message : String(error)
      );
      this.loadedMtimeMs = mtimeMs;
    }
  }
}
