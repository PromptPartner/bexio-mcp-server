/**
 * Encrypted, file-backed store for Bexio OAuth connections.
 *
 * The whole file is one AES-256-GCM blob so labels, company names and tokens are
 * all protected at rest. Writes go through a temp file + rename so a crash can
 * never leave a half-written store (which would lose the rotating refresh token).
 *
 * Structure adapted from asig/bexio-mcp-server (bexio-oauth-bridge/src/store.ts, MIT).
 */

import fs from "node:fs";
import path from "node:path";
import { decrypt, encrypt } from "./crypto.js";

export type ConnectionStatus = "active" | "reconnect_required";

export interface StoredConnection {
  label: string;
  accessToken: string;
  refreshToken: string;
  /** Epoch ms at which the access token expires. */
  accessTokenExpiresAt: number;
  scope?: string;
  companyName?: string;
  companyId?: string;
  userEmail?: string;
  connectedAt: number;
  lastRefreshAt: number;
  status: ConnectionStatus;
  lastError?: string;
}

interface StoreFile {
  version: 1;
  connections: Record<string, StoredConnection>;
}

export class ConnectionStore {
  private readonly filePath: string;
  private readonly key: Buffer;
  private data: StoreFile;

  constructor(filePath: string, key: Buffer) {
    this.filePath = path.resolve(filePath);
    this.key = key;
    fs.mkdirSync(path.dirname(this.filePath), { recursive: true });
    this.data = this.load();
  }

  private load(): StoreFile {
    if (!fs.existsSync(this.filePath)) {
      return { version: 1, connections: {} };
    }
    const raw = fs.readFileSync(this.filePath, "utf8").trim();
    if (!raw) return { version: 1, connections: {} };
    let plaintext: string;
    try {
      plaintext = decrypt(raw, this.key);
    } catch {
      throw new Error(
        `Cannot decrypt ${this.filePath}. The token encryption key does not match the one used to write it.`
      );
    }
    const parsed = JSON.parse(plaintext) as Partial<StoreFile>;
    return { version: 1, connections: parsed.connections ?? {} };
  }

  private save(): void {
    const tmp = `${this.filePath}.tmp`;
    fs.writeFileSync(tmp, encrypt(JSON.stringify(this.data), this.key), { encoding: "utf8", mode: 0o600 });
    fs.renameSync(tmp, this.filePath);
  }

  get(label: string): StoredConnection | undefined {
    const c = this.data.connections[label];
    return c ? { ...c } : undefined;
  }

  list(): StoredConnection[] {
    return Object.values(this.data.connections).map((c) => ({ ...c }));
  }

  upsert(connection: StoredConnection): void {
    this.data.connections[connection.label] = { ...connection };
    this.save();
  }

  remove(label: string): boolean {
    if (!this.data.connections[label]) return false;
    delete this.data.connections[label];
    this.save();
    return true;
  }
}
