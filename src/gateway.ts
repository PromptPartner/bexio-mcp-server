/**
 * Gateway mode: several MCP clients share one server; Bexio is accessed through
 * OAuth connections that refresh themselves in the background.
 *
 * Every secret can be given directly (NAME=value) or as a file (NAME_FILE=/run/secrets/...),
 * which is how Docker secrets are mounted.
 */

import fs from "node:fs";
import path from "node:path";
import { logger } from "./logger.js";
import { ConnectionManager, DEFAULT_ISSUER, DEFAULT_SCOPES } from "./auth/bexio-oidc.js";
import { ClientRegistry } from "./auth/client-config.js";
import { parseEncryptionKey } from "./auth/crypto.js";
import { ConnectionStore } from "./auth/token-store.js";
import { createGatewayServer } from "./transports/streamable-http.js";

export interface GatewayArgs {
  host: string;
  port: number;
  bexioBaseUrl: string;
}

/** An empty list is valid: the admin page works, and clients are added afterwards. */
function ensureClientsFile(filePath: string): void {
  if (fs.existsSync(filePath)) return;
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, "{}\n", { encoding: "utf8", mode: 0o644 });
  logger.warn(`${filePath} did not exist; created an empty client list.`);
}

function readSetting(name: string, env: NodeJS.ProcessEnv): string | undefined {
  const file = env[`${name}_FILE`]?.trim();
  if (file) {
    try {
      return fs.readFileSync(file, "utf8").trim() || undefined;
    } catch (error) {
      throw new Error(`${name}_FILE points to ${file}, which cannot be read: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return env[name]?.trim() || undefined;
}

function requireSetting(name: string, env: NodeJS.ProcessEnv, hint: string): string {
  const value = readSetting(name, env);
  if (!value) throw new Error(`${name} (or ${name}_FILE) is required: ${hint}`);
  return value;
}

export async function startGateway(args: GatewayArgs, env: NodeJS.ProcessEnv = process.env): Promise<void> {
  const publicBaseUrl = requireSetting("PUBLIC_BASE_URL", env, "the HTTPS address users reach the gateway at").replace(/\/+$/, "");
  const clientId = requireSetting("BEXIO_CLIENT_ID", env, "from your app on developer.bexio.com");
  const clientSecret = requireSetting("BEXIO_CLIENT_SECRET", env, "from your app on developer.bexio.com");
  const encryptionKey = parseEncryptionKey(
    requireSetting("TOKEN_ENCRYPTION_KEY", env, "64 hex chars, generate with: openssl rand -hex 32")
  );
  const adminKey = requireSetting("GATEWAY_ADMIN_KEY", env, "password for the /admin pages");
  if (adminKey.length < 16) throw new Error("GATEWAY_ADMIN_KEY must be at least 16 characters.");

  const scopes = (readSetting("BEXIO_SCOPES", env) ?? DEFAULT_SCOPES.join(" ")).split(/[\s,]+/).filter(Boolean);
  if (!scopes.includes("offline_access")) {
    throw new Error("BEXIO_SCOPES must include offline_access, otherwise the gateway cannot refresh in the background.");
  }
  const redirectUri = readSetting("BEXIO_REDIRECT_URI", env) ?? `${publicBaseUrl}/oauth/callback`;
  const dataDir = readSetting("DATA_DIR", env) ?? "/data";
  const clientsFile = readSetting("MCP_CLIENTS_FILE", env) ?? "/config/clients.json";
  const sessionTtlMinutes = Number(readSetting("MCP_SESSION_TTL_MINUTES", env) ?? "60");

  ensureClientsFile(clientsFile);

  const store = new ConnectionStore(path.join(dataDir, "connections.enc"), encryptionKey);
  const connections = new ConnectionManager({
    store,
    bexioBaseUrl: args.bexioBaseUrl,
    oidc: {
      clientId,
      clientSecret,
      issuer: (readSetting("BEXIO_OAUTH_ISSUER", env) ?? DEFAULT_ISSUER).replace(/\/+$/, ""),
      redirectUri,
      scopes,
    },
  });
  const clients = new ClientRegistry(clientsFile);

  const existing = connections.list();
  logger.info(
    `Gateway: ${existing.length} Bexio connection(s) [${existing.map((c) => `${c.label}:${c.status}`).join(", ")}], ` +
      `${clients.list().filter((c) => !c.disabled).length} enabled client(s), redirect URI ${redirectUri}`
  );
  if (existing.length === 0) {
    logger.warn(`No Bexio connection yet. Open ${publicBaseUrl}/admin and connect one (e.g. "backoffice").`);
  }

  connections.startBackgroundRefresh();

  const app = await createGatewayServer({
    host: args.host,
    port: args.port,
    publicBaseUrl,
    adminKey,
    connections,
    clients,
    sessionTtlMs: Math.max(1, sessionTtlMinutes) * 60 * 1000,
  });

  const shutdown = async (signal: string) => {
    logger.info(`Shutting down gateway (${signal})`);
    connections.stopBackgroundRefresh();
    await app.close().catch(() => undefined);
    process.exit(0);
  };
  process.on("SIGINT", () => void shutdown("SIGINT"));
  process.on("SIGTERM", () => void shutdown("SIGTERM"));
}
