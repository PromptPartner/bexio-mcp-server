/**
 * Gateway transport: MCP Streamable HTTP for several clients at once.
 *
 * - POST/GET/DELETE /mcp   MCP endpoint. Clients authenticate with their own access
 *                          key (Authorization: Bearer <key>); each MCP session is bound
 *                          to that client and to the Bexio connection it maps to.
 * - GET  /admin            Status page (connections, clients). HTTP Basic auth, password = admin key.
 * - GET  /admin/connect    Starts the one-time Bexio login for a connection label.
 * - GET  /oauth/callback   Redirect target registered on the Bexio app.
 * - GET  /health           Liveness for Docker.
 */

import { randomUUID } from "node:crypto";
import Fastify, { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { logger } from "../logger.js";
import { BexioMcpServer } from "../server.js";
import type { ConnectionManager } from "../auth/bexio-oidc.js";
import { LABEL_PATTERN } from "../auth/bexio-oidc.js";
import type { ClientRegistry, GatewayClient } from "../auth/client-config.js";
import { safeEqual } from "../auth/crypto.js";

export interface GatewayServerOptions {
  host: string;
  port: number;
  publicBaseUrl: string;
  adminKey: string;
  connections: ConnectionManager;
  clients: ClientRegistry;
  sessionTtlMs: number;
}

interface Session {
  transport: StreamableHTTPServerTransport;
  server: BexioMcpServer;
  client: GatewayClient;
  lastSeen: number;
}

export async function createGatewayServer(options: GatewayServerOptions): Promise<FastifyInstance> {
  const { connections, clients } = options;
  const sessions = new Map<string, Session>();
  const app = Fastify({ logger: false, trustProxy: true, bodyLimit: 10 * 1024 * 1024 });

  // ===== MCP =====

  const authenticate = (request: FastifyRequest, reply: FastifyReply): GatewayClient | undefined => {
    const header = request.headers.authorization ?? "";
    const match = /^Bearer\s+(.+)$/i.exec(header);
    const client = match ? clients.authenticate(match[1]!.trim()) : undefined;
    if (!client) {
      logger.warn(`Rejected MCP request from ${request.ip}: ${match ? "unknown or disabled key" : "missing Bearer key"}`);
      void reply
        .code(401)
        .header("WWW-Authenticate", 'Bearer realm="bexio-mcp-gateway"')
        .send(jsonRpcError(-32001, "Unauthorized: send your gateway access key as 'Authorization: Bearer <key>'."));
    }
    return client;
  };

  /** Resolve the session for a non-initialize request and check it belongs to this client. */
  const resumeSession = (request: FastifyRequest, reply: FastifyReply, client: GatewayClient): Session | undefined => {
    const sessionId = headerValue(request.headers["mcp-session-id"]);
    if (!sessionId) {
      void reply.code(400).send(jsonRpcError(-32000, "Missing Mcp-Session-Id header; send an initialize request first."));
      return undefined;
    }
    const session = sessions.get(sessionId);
    if (!session) {
      void reply.code(404).send(jsonRpcError(-32001, "Session not found or expired; re-initialize."));
      return undefined;
    }
    if (session.client.name !== client.name) {
      logger.warn(`Client "${client.name}" tried to use a session of "${session.client.name}"`);
      void reply.code(403).send(jsonRpcError(-32001, "This session belongs to another client."));
      return undefined;
    }
    session.lastSeen = Date.now();
    return session;
  };

  app.post("/mcp", async (request, reply) => {
    const client = authenticate(request, reply);
    if (!client) return reply;

    if (headerValue(request.headers["mcp-session-id"])) {
      const session = resumeSession(request, reply, client);
      if (!session) return reply;
      reply.hijack();
      await session.transport.handleRequest(request.raw, reply.raw, request.body);
      return reply;
    }

    if (!isInitializeRequest(request.body)) {
      return reply.code(400).send(jsonRpcError(-32000, "Missing Mcp-Session-Id header; send an initialize request first."));
    }
    if (!connections.has(client.connection)) {
      logger.error(`Client "${client.name}" maps to Bexio connection "${client.connection}", which is not set up.`);
      return reply
        .code(503)
        .send(jsonRpcError(-32002, `Bexio connection "${client.connection}" is not set up yet. Ask an admin to connect it.`));
    }

    const server = new BexioMcpServer({
      getClient: () => connections.getClient(client.connection),
      context: { clientName: client.name, connection: client.connection },
    });
    server.initialize();

    const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId) => {
        sessions.set(sessionId, { transport, server, client, lastSeen: Date.now() });
        logger.info(`Session opened for "${client.name}" (connection "${client.connection}"); ${sessions.size} active.`);
      },
    });
    transport.onclose = () => {
      const sessionId = transport.sessionId;
      if (sessionId && sessions.delete(sessionId)) {
        logger.info(`Session closed for "${client.name}"; ${sessions.size} active.`);
      }
    };

    await server.connect(transport);
    reply.hijack();
    await transport.handleRequest(request.raw, reply.raw, request.body);
    if (!transport.sessionId) await server.close().catch(() => undefined);
    return reply;
  });

  const handleSessionRequest = async (request: FastifyRequest, reply: FastifyReply) => {
    const client = authenticate(request, reply);
    if (!client) return reply;
    const session = resumeSession(request, reply, client);
    if (!session) return reply;
    reply.hijack();
    await session.transport.handleRequest(request.raw, reply.raw);
    return reply;
  };
  app.get("/mcp", handleSessionRequest);
  app.delete("/mcp", handleSessionRequest);

  const sweeper = setInterval(() => {
    const cutoff = Date.now() - options.sessionTtlMs;
    for (const [sessionId, session] of sessions) {
      if (session.lastSeen >= cutoff && clients.isActive(session.client.name)) continue;
      sessions.delete(sessionId);
      void session.server.close().catch(() => undefined);
      logger.info(`Session of "${session.client.name}" closed (idle or client disabled); ${sessions.size} active.`);
    }
  }, 60 * 1000);
  sweeper.unref();
  app.addHook("onClose", async () => {
    clearInterval(sweeper);
    await Promise.all([...sessions.values()].map((s) => s.server.close().catch(() => undefined)));
    sessions.clear();
  });

  // ===== Health =====

  app.get("/health", async () => {
    const all = connections.list();
    const healthy = all.length > 0 && all.every((c) => c.status === "active");
    return { status: healthy ? "ok" : "degraded" };
  });

  // ===== Admin =====

  const requireAdmin = (request: FastifyRequest, reply: FastifyReply): boolean => {
    const header = request.headers.authorization ?? "";
    let presented: string | undefined;
    const basic = /^Basic\s+(.+)$/i.exec(header);
    if (basic) {
      const decoded = Buffer.from(basic[1]!, "base64").toString("utf8");
      presented = decoded.slice(decoded.indexOf(":") + 1);
    }
    const bearer = /^Bearer\s+(.+)$/i.exec(header);
    if (bearer) presented = bearer[1]!.trim();
    if (presented && safeEqual(presented, options.adminKey)) return true;
    void reply
      .code(401)
      .header("WWW-Authenticate", 'Basic realm="bexio-mcp-gateway admin", charset="UTF-8"')
      .type("text/plain")
      .send("Admin key required.");
    return false;
  };

  const sameOrigin = (request: FastifyRequest): boolean => {
    const origin = headerValue(request.headers.origin) ?? headerValue(request.headers.referer);
    if (!origin) return false;
    try {
      return new URL(origin).origin === new URL(options.publicBaseUrl).origin;
    } catch {
      return false;
    }
  };

  app.get("/admin", async (request, reply) => {
    if (!requireAdmin(request, reply)) return reply;
    return reply.type("text/html; charset=utf-8").send(renderAdminPage(connections, clients));
  });

  app.get<{ Querystring: { label?: string } }>("/admin/connect", async (request, reply) => {
    if (!requireAdmin(request, reply)) return reply;
    const label = (request.query.label ?? "").trim().toLowerCase();
    if (!LABEL_PATTERN.test(label)) {
      return reply
        .code(400)
        .type("text/html; charset=utf-8")
        .send(page("Invalid label", `<p>Use 1-40 lowercase letters, digits, '-' or '_'.</p><p><a href="/admin">Back</a></p>`));
    }
    return reply.redirect(connections.startAuthorization(label));
  });

  app.post<{ Params: { label: string } }>("/admin/connections/:label/delete", async (request, reply) => {
    if (!requireAdmin(request, reply)) return reply;
    if (!sameOrigin(request)) return reply.code(403).send("Cross-origin request rejected.");
    connections.remove(request.params.label);
    logger.info(`Bexio connection "${request.params.label}" removed by admin.`);
    return reply.code(303).redirect("/admin");
  });

  app.get<{ Querystring: { code?: string; state?: string; error?: string; error_description?: string } }>(
    "/oauth/callback",
    async (request, reply) => {
      const { code, state, error, error_description } = request.query;
      reply.type("text/html; charset=utf-8");
      if (error) {
        return reply
          .code(400)
          .send(page("Bexio login cancelled", `<p>${escapeHtml(error_description ?? error)}</p><p><a href="/admin">Back</a></p>`));
      }
      if (!code || !state) {
        return reply.code(400).send(page("Invalid callback", `<p>Missing code or state.</p>`));
      }
      try {
        const connection = await connections.completeAuthorization(state, code);
        return reply.send(
          page(
            "Bexio connected",
            `<p>Connection <b>${escapeHtml(connection.label)}</b> is set up${
              connection.companyName ? ` for <b>${escapeHtml(connection.companyName)}</b>` : ""
            }${connection.userEmail ? ` (user ${escapeHtml(connection.userEmail)})` : ""}.</p>
             <p>The gateway now refreshes the login automatically in the background.</p>
             <p><a href="/admin">Back to status</a></p>`
          )
        );
      } catch (err) {
        logger.error("OAuth callback failed:", err instanceof Error ? err.message : String(err));
        return reply
          .code(400)
          .send(page("Connection failed", `<p>${escapeHtml(err instanceof Error ? err.message : String(err))}</p><p><a href="/admin">Back</a></p>`));
      }
    }
  );

  await app.listen({ host: options.host, port: options.port });
  logger.info(`Gateway listening on ${options.host}:${options.port} (public URL ${options.publicBaseUrl})`);
  return app;
}

function headerValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function jsonRpcError(code: number, message: string) {
  return { jsonrpc: "2.0", error: { code, message }, id: null };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatTime(ms: number | undefined): string {
  return ms ? new Date(ms).toISOString().replace("T", " ").slice(0, 16) + " UTC" : "-";
}

function page(title: string, body: string): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${escapeHtml(title)} - bexio-mcp-gateway</title>
<style>body{font-family:system-ui,sans-serif;max-width:960px;margin:2rem auto;padding:0 1rem;color:#222}
table{border-collapse:collapse;width:100%;margin:1rem 0}th,td{border-bottom:1px solid #ddd;padding:.4rem;text-align:left;font-size:.9rem}
.bad{color:#b00020;font-weight:600}.ok{color:#1b7f3b;font-weight:600}form{display:inline}code{background:#f3f3f3;padding:0 .2rem}</style>
</head><body><h1>${escapeHtml(title)}</h1>${body}</body></html>`;
}

function renderAdminPage(connections: ConnectionManager, clients: ClientRegistry): string {
  const conns = connections.list();
  const connRows = conns
    .map(
      (c) => `<tr>
  <td><code>${escapeHtml(c.label)}</code></td>
  <td>${escapeHtml(c.companyName ?? "-")}</td>
  <td>${escapeHtml(c.userEmail ?? "-")}</td>
  <td class="${c.status === "active" ? "ok" : "bad"}">${c.status === "active" ? "active" : "reconnect required"}</td>
  <td>${formatTime(c.lastRefreshAt)}</td>
  <td>${c.lastError ? escapeHtml(c.lastError) : ""}</td>
  <td><a href="/admin/connect?label=${encodeURIComponent(c.label)}">Reconnect</a>
      <form method="post" action="/admin/connections/${encodeURIComponent(c.label)}/delete"
            onsubmit="return confirm('Remove connection ${escapeHtml(c.label)}?')"><button>Remove</button></form></td>
</tr>`
    )
    .join("");
  const known = new Set(conns.map((c) => c.label));
  const clientRows = clients
    .list()
    .map(
      (c) => `<tr><td>${escapeHtml(c.name)}</td><td><code>${escapeHtml(c.connection)}</code>${
        known.has(c.connection) ? "" : ' <span class="bad">(not connected)</span>'
      }</td><td>${c.disabled ? "disabled" : "enabled"}</td></tr>`
    )
    .join("");
  return page(
    "bexio-mcp-gateway",
    `<h2>Bexio connections</h2>
<table><tr><th>Label</th><th>Company</th><th>Bexio user</th><th>Status</th><th>Last refresh</th><th>Last error</th><th></th></tr>
${connRows || '<tr><td colspan="7">No connection yet.</td></tr>'}</table>
<form method="get" action="/admin/connect">
  <label>New connection label <input name="label" value="${conns.length === 0 ? "backoffice" : ""}" pattern="[a-z0-9][a-z0-9_-]{0,39}" required></label>
  <button>Connect with Bexio</button>
</form>
<h2>Clients</h2>
<table><tr><th>Name</th><th>Connection</th><th>State</th></tr>
${clientRows || '<tr><td colspan="3">No clients in clients.json.</td></tr>'}</table>
<p>Add clients with <code>scripts/client-add.sh &lt;name&gt; &lt;connection&gt;</code> on the Docker host; changes to clients.json apply without restart.</p>`
  );
}
