#!/usr/bin/env node

/**
 * Bexio MCP Server v2 Entry Point
 *
 * This is the main entry point for the Bexio MCP server.
 * It handles:
 * - Environment variable loading
 * - Command line argument parsing
 * - Server initialization and startup
 * - Dual transport: stdio (Claude Desktop) and http (n8n/remote)
 *
 * IMPORTANT: All logging goes to stderr via logger.ts.
 * stdout is reserved for MCP JSON-RPC protocol messages (stdio mode only).
 */

import { logger } from "./logger.js";
import { parseCompanyTokens, companyManager } from "./company-manager.js";

// Surface otherwise-silent failures. A peripheral throw or rejection must never
// vanish without a trace: the v2.3.0 startup crash exited the process during the
// `initialize` handshake with no stderr the user could see. Log the full stack;
// do NOT exit here — a non-fatal background error should not kill a running server.
process.on("uncaughtException", (err) => {
  logger.error(
    "[FATAL] uncaughtException:",
    err instanceof Error ? (err.stack ?? err.message) : String(err)
  );
});
process.on("unhandledRejection", (reason) => {
  logger.error(
    "[FATAL] unhandledRejection:",
    reason instanceof Error ? (reason.stack ?? reason.message) : String(reason)
  );
});

interface ParsedArgs {
  mode: "stdio" | "http";
  host: string;
  port: number;
}

function parseArgs(): ParsedArgs {
  const args = process.argv.slice(2);

  // Parse --mode
  const modeIndex = args.indexOf("--mode");
  const modeArg = modeIndex !== -1 ? args[modeIndex + 1] : "stdio";
  const mode = modeArg === "http" ? "http" : "stdio";

  // Parse --host (for HTTP mode)
  const hostIndex = args.indexOf("--host");
  const host = hostIndex !== -1 ? args[hostIndex + 1] ?? "0.0.0.0" : "0.0.0.0";

  // Parse --port (for HTTP mode)
  const portIndex = args.indexOf("--port");
  const portStr = portIndex !== -1 ? args[portIndex + 1] : "8000";
  const port = parseInt(portStr, 10) || 8000;

  return { mode, host, port };
}

/**
 * Load environment variables from a .env file (optional - for local/npm usage).
 * MCPB bundles and claude.ai inject env vars before the process starts, so a
 * missing dotenv is fine. This is AWAITED so process.env is populated BEFORE we
 * read it — the previous fire-and-forget `import("dotenv")` raced the reads and
 * left .env-reliant users (npm installs) with an undefined token.
 */
async function loadEnv(): Promise<void> {
  try {
    const dotenv = await import("dotenv");
    dotenv.config();
  } catch {
    // dotenv not available (e.g. inside the MCPB bundle) — env already provided by host.
  }
}

async function main(): Promise<void> {
  await loadEnv();

  // Read configuration only after dotenv has loaded.
  const BEXIO_BASE_URL =
    process.env["BEXIO_BASE_URL"] ?? "https://api.bexio.com/2.0";

  const { mode, host, port } = parseArgs();

  // v2.5.0: one or many companies. Single BEXIO_API_TOKEN → one company ("default");
  // BEXIO_API_TOKENS → multiple, switchable via the select_company tool.
  const tokens = parseCompanyTokens(process.env);
  if (tokens.length === 0) {
    logger.error("BEXIO_API_TOKEN (or BEXIO_API_TOKENS) environment variable is required");
    logger.error("Set it in your .env file or environment");
    process.exit(1);
  }
  logger.info(`Using Bexio API base URL: ${BEXIO_BASE_URL}`);

  companyManager.init({
    baseUrl: BEXIO_BASE_URL,
    tokens,
    defaultCompany: process.env["BEXIO_DEFAULT_COMPANY"],
  });

  if (mode === "stdio") {
    logger.info("Starting in stdio mode (for Claude Desktop)");

    // Imported dynamically AFTER loadEnv() so the tool registry's module-load
    // env reads (e.g. BEXIO_ENABLED_CATEGORIES in tools/index.ts) also see .env values.
    const { BexioMcpServer } = await import("./server.js");
    const server = new BexioMcpServer();
    server.initialize();
    await server.run();
  } else if (mode === "http") {
    logger.info(`Starting in HTTP mode on ${host}:${port} (for n8n/remote access)`);

    const { createHttpServer } = await import("./transports/http.js");
    await createHttpServer({ host, port });

    // Keep the process alive
    logger.info("HTTP server running. Press Ctrl+C to stop.");
  } else {
    logger.error(`Invalid mode: ${mode}. Use 'stdio' or 'http'.`);
    process.exit(1);
  }
}

// Run the server
main().catch((error: unknown) => {
  logger.error("Fatal error:", error);
  process.exit(1);
});
