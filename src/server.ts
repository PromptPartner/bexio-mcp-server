/**
 * Bexio MCP Server v2
 *
 * SDK 1.25.2 patterns:
 * - Import from "@modelcontextprotocol/sdk/server/mcp.js"
 * - McpServer.tool() for individual tool registration
 * - Use server.connect(transport) to start
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { logger } from "./logger.js";
import { companyManager } from "./company-manager.js";
import { getAllToolDefinitions, getHandler } from "./tools/index.js";
import { formatSuccessResponse, formatErrorResponse, McpError } from "./shared/index.js";
import { registerUIResources } from "./ui-resources.js";
import { jsonSchemaToZodShape } from "./schema-converter.js";

const SERVER_NAME = "bexio-mcp-server";
// Keep in lockstep with package.json / manifest.json / server.json on every release.
// (The MCPB bundle's dist/package.json is minimal and has no version field, so this
// is inlined rather than read back from package.json.)
const SERVER_VERSION = "2.5.0";

export class BexioMcpServer {
  private server: McpServer;

  constructor() {
    this.server = new McpServer({
      name: SERVER_NAME,
      version: SERVER_VERSION,
    });
  }

  /** Register tools. The active Bexio company is resolved per call via
   * companyManager (initialized in index.ts before this runs). */
  initialize(): void {
    this.registerTools();

    // Interactive UI panels (MCP Apps) are OPT-IN. They are non-essential for the
    // core data tools, and a UI registration failure must NEVER take down the 310
    // data tools — so registration is both gated behind BEXIO_ENABLE_UI and wrapped
    // in try/catch as belt-and-suspenders. This is what makes a peripheral UI bug
    // (like the v2.3.0 import.meta.dirname crash) unable to break the whole server.
    const toolCount = getAllToolDefinitions().length;
    if (process.env["BEXIO_ENABLE_UI"] === "true") {
      try {
        registerUIResources(this.server, companyManager.getActiveClient());
        logger.info(`Initialized with ${toolCount} tools + 3 UI tools (MCP Apps enabled)`);
      } catch (error) {
        logger.error(
          "UI registration failed (non-fatal); core tools remain available:",
          error instanceof Error ? (error.stack ?? error.message) : String(error)
        );
      }
    } else {
      logger.info(`Initialized with ${toolCount} tools (UI disabled; set BEXIO_ENABLE_UI=true to enable MCP Apps panels)`);
    }
  }

  private registerTools(): void {
    // Register ping tool for SDK validation
    this.server.tool(
      "ping",
      "Test tool that returns pong - validates SDK integration",
      {},
      async () => {
        logger.debug("ping tool called");
        return {
          content: [{ type: "text" as const, text: "pong" }],
        };
      }
    );

    // Register all domain tools
    const definitions = getAllToolDefinitions();

    for (const def of definitions) {
      const handler = getHandler(def.name);
      if (!handler) {
        logger.warn(`No handler found for tool: ${def.name}`);
        continue;
      }

      // SDK expects a ZodRawShape (plain object with Zod schemas). Derive it from
      // the tool's JSON-Schema inputSchema so tools/list advertises the real
      // parameters AND the SDK passes parsed args through to the handler. Passing
      // an empty shape here is what previously caused every parametrized tool to
      // receive `undefined` (see schema-converter.ts). Handlers still re-validate
      // with their domain Zod schema.
      let inputShape: z.ZodRawShape;
      try {
        inputShape = jsonSchemaToZodShape(def.inputSchema);
      } catch (error) {
        logger.warn(`Failed to convert inputSchema for tool ${def.name}; registering with empty shape`, error);
        inputShape = {};
      }

      // Cast the dynamically-built shape to `any` for the SDK call: with a
      // statically-unknown ZodRawShape, the SDK's generic arg-type inference
      // (z.infer over the shape) recurses past TS's depth limit (TS2589). Args
      // are re-validated by the handler's own schema, so the static type is moot.
      this.server.tool(
        def.name,
        def.description || "",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        inputShape as any,
        async (args: unknown) => {
          try {
            // Resolve the currently-active company's client per call so
            // select_company switches take effect immediately.
            const client = companyManager.getActiveClient();
            const result = await handler(client, args);
            const meta = companyManager.hasMultiple()
              ? { active_company: companyManager.getActiveLabel() }
              : undefined;
            return formatSuccessResponse(def.name, result, meta);
          } catch (error) {
            if (error instanceof McpError) {
              return formatErrorResponse(error);
            }
            if (error instanceof z.ZodError) {
              return formatErrorResponse(
                McpError.validation(error.message, { issues: error.issues })
              );
            }
            return formatErrorResponse(
              error instanceof Error
                ? error
                : new Error(String(error))
            );
          }
        }
      );
    }

    logger.info(`Registered ${definitions.length + 1} tools (including ping)`);
  }

  async run(): Promise<void> {
    logger.info(`Starting ${SERVER_NAME} v${SERVER_VERSION}`);

    const transport = new StdioServerTransport();
    await this.server.connect(transport);

    logger.info("Server connected to stdio transport");

    // #11: in stdio mode the parent MCP client owns our lifecycle. When it
    // disconnects it closes our stdin; if it doesn't, the process used to linger
    // forever as an orphan still holding the API token. Exit on stdin
    // end/close and on termination signals. `closing` makes this idempotent so
    // several triggers (e.g. stdin 'end' then SIGTERM) can't double-close.
    // This path is stdio-only — HTTP mode never calls run() (see index.ts).
    let closing = false;
    const shutdown = async (reason: string): Promise<void> => {
      if (closing) return;
      closing = true;
      logger.info(`Shutting down (${reason})`);
      try {
        await this.server.close();
      } catch (error) {
        logger.error(
          "Error during shutdown:",
          error instanceof Error ? error.message : String(error)
        );
      }
      process.exit(0);
    };

    process.stdin.on("end", () => void shutdown("stdin end"));
    process.stdin.on("close", () => void shutdown("stdin close"));
    process.on("SIGINT", () => void shutdown("SIGINT"));
    process.on("SIGTERM", () => void shutdown("SIGTERM"));
    // Ensure stdin is flowing so 'end'/'close' actually fire on client disconnect.
    process.stdin.resume();
  }
}
