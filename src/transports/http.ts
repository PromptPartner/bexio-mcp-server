/**
 * HTTP Transport for Bexio MCP Server.
 * Provides HTTP/REST access for n8n and other remote clients.
 *
 * IMPORTANT: All logging uses logger (stderr), stdout reserved for nothing in HTTP mode.
 */

import { timingSafeEqual } from "node:crypto";
import Fastify, { FastifyInstance } from "fastify";
import cors from "@fastify/cors";
import { logger } from "../logger.js";
import { SERVER_VERSION } from "../version.js";
import { getAllToolDefinitions, createHandlerRegistry } from "../tools/index.js";

export interface HttpServerOptions {
  host: string;
  port: number;
  /** BEXIO_HTTP_TOKEN: when set, every route except GET / requires this bearer token. */
  authToken?: string;
}

const LOOPBACK_HOSTS = new Set(["127.0.0.1", "::1", "localhost"]);

function bearerMatches(header: string | undefined, expected: Buffer): boolean {
  const given = Buffer.from(/^Bearer\s+(.+)$/i.exec(header ?? "")?.[1]?.trim() ?? "");
  return given.length === expected.length && timingSafeEqual(given, expected);
}

/**
 * Creates an HTTP server for the MCP server.
 * This enables n8n and other HTTP clients to interact with the Bexio API.
 */
export async function createHttpServer(
  options: HttpServerOptions
): Promise<FastifyInstance> {
  const { host, port, authToken } = options;

  // Handler registry resolves the active company's client per call (multi-company).
  const handlerRegistry = createHandlerRegistry();

  const app: FastifyInstance = Fastify({
    logger: false, // We use our own logger
  });

  // Register CORS for browser/n8n access
  await app.register(cors, {
    origin: true,
  });

  logger.info("HTTP server initializing...");

  // Every tool reads or writes the company's books, so the HTTP surface needs a
  // credential. Opt-in for now (existing n8n setups keep working); without it, say
  // plainly what is exposed.
  if (authToken) {
    const expected = Buffer.from(authToken);
    app.addHook("onRequest", async (request, reply) => {
      if (request.method === "OPTIONS") return; // CORS preflight carries no credentials
      if (request.method === "GET" && request.url.split("?")[0] === "/") return; // health check
      if (!bearerMatches(request.headers.authorization, expected)) {
        return reply.code(401).header("WWW-Authenticate", "Bearer").send({ error: "Unauthorized" });
      }
    });
    logger.info("HTTP bearer auth enabled (BEXIO_HTTP_TOKEN).");
  } else if (LOOPBACK_HOSTS.has(host)) {
    logger.warn(
      "No BEXIO_HTTP_TOKEN set: the HTTP endpoints are unauthenticated. Bound to loopback, but CORS allows any origin, so a web page open in your browser can call them. Set BEXIO_HTTP_TOKEN to require a bearer token."
    );
  } else {
    logger.warn(
      `!!! No BEXIO_HTTP_TOKEN set and listening on ${host}: ANYONE who can reach port ${port} can read and change your bexio data. Set BEXIO_HTTP_TOKEN (clients send "Authorization: Bearer <token>"), or bind to 127.0.0.1 with --host.`
    );
  }

  // Health check endpoint
  app.get("/", async () => {
    return {
      status: "running",
      server: "bexio-mcp-server",
      version: SERVER_VERSION,
      mode: "http",
    };
  });

  // List tools endpoint (GET for simplicity)
  app.get("/tools", async () => {
    const tools = getAllToolDefinitions();
    return { tools, count: tools.length };
  });

  // MCP-style JSON-RPC endpoint
  app.post<{
    Body: {
      jsonrpc?: string;
      id?: string | number;
      method: string;
      params?: unknown;
    } | Array<{
      jsonrpc?: string;
      id?: string | number;
      method: string;
      params?: unknown;
    }>;
  }>("/mcp", async (request, reply) => {
    const body = request.body;

    // Handle batch requests
    if (Array.isArray(body)) {
      const results = await Promise.all(
        body.map((req) => handleJsonRpcRequest(req, handlerRegistry))
      );
      return results;
    }

    // Handle single request
    return handleJsonRpcRequest(body, handlerRegistry);
  });

  // Direct tool call endpoint (simpler than JSON-RPC)
  app.post<{
    Body: {
      name: string;
      arguments?: unknown;
    };
  }>("/tools/call", async (request, reply) => {
    const toolName = request.body?.name;
    try {
      const { name, arguments: args = {} } = request.body;

      if (!name) {
        return reply.code(400).send({ error: "Tool name is required" });
      }

      const handler = handlerRegistry.get(name);
      if (!handler) {
        return reply.code(404).send({ error: `Unknown tool: ${name}` });
      }

      const result = await handler(args);
      return {
        success: true,
        data: result,
        tool: name,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return reply.code(500).send({
        success: false,
        error: errorMessage,
        tool: toolName || "unknown",
        timestamp: new Date().toISOString(),
      });
    }
  });

  // n8n-specific endpoint for easier integration
  app.post<{
    Body: {
      tool: string;
      params?: unknown;
    };
  }>("/n8n/call", async (request, reply) => {
    try {
      const { tool, params = {} } = request.body;

      if (!tool) {
        return reply.code(400).send({ error: "Tool name is required" });
      }

      const handler = handlerRegistry.get(tool);
      if (!handler) {
        return reply.code(404).send({ error: `Unknown tool: ${tool}` });
      }

      const result = await handler(params);
      return {
        success: true,
        data: result,
        tool,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return reply.code(500).send({
        success: false,
        error: errorMessage,
        tool: request.body?.tool || "unknown",
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Start server
  try {
    await app.listen({ host, port });
    logger.info(`HTTP server listening on ${host}:${port}`);
    logger.info("Available endpoints:");
    logger.info("  GET  /          - Health check");
    logger.info("  GET  /tools     - List all tools");
    logger.info("  POST /mcp       - JSON-RPC endpoint");
    logger.info("  POST /tools/call - Direct tool call");
    logger.info("  POST /n8n/call  - n8n-friendly endpoint");
  } catch (error) {
    logger.error("Failed to start HTTP server:", error);
    throw error;
  }

  return app;
}

/**
 * Handle a JSON-RPC request.
 */
async function handleJsonRpcRequest(
  request: {
    jsonrpc?: string;
    id?: string | number;
    method: string;
    params?: unknown;
  },
  handlerRegistry: Map<string, (args: unknown) => Promise<unknown>>
): Promise<unknown> {
  const { id, method, params } = request;

  try {
    // Handle MCP protocol methods
    if (method === "initialize") {
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: {
            name: "bexio-mcp-server",
            version: SERVER_VERSION,
          },
        },
      };
    }

    if (method === "tools/list") {
      const tools = getAllToolDefinitions();
      return {
        jsonrpc: "2.0",
        id,
        result: { tools },
      };
    }

    if (method === "tools/call") {
      const callParams = params as { name: string; arguments?: unknown } | undefined;
      if (!callParams?.name) {
        return {
          jsonrpc: "2.0",
          id,
          error: { code: -32602, message: "Invalid params: name is required" },
        };
      }

      const handler = handlerRegistry.get(callParams.name);
      if (!handler) {
        return {
          jsonrpc: "2.0",
          id,
          error: { code: -32601, message: `Unknown tool: ${callParams.name}` },
        };
      }

      const result = await handler(callParams.arguments ?? {});
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
        },
      };
    }

    // Unknown method
    return {
      jsonrpc: "2.0",
      id,
      error: { code: -32601, message: `Method not found: ${method}` },
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      jsonrpc: "2.0",
      id,
      error: { code: -32603, message: errorMessage },
    };
  }
}
