/**
 * JSON Schema → Zod Shape Converter
 *
 * Converts the JSON-Schema `inputSchema` carried on every tool definition into a
 * `ZodRawShape` that `McpServer.tool()` requires. This is what makes the MCP
 * protocol expose the full parameter schema to clients (Claude Desktop, Claude
 * Code, …).
 *
 * Without this, `McpServer.tool(name, desc, {}, handler)` registers tools with an
 * EMPTY shape. Two things then go wrong for every tool that takes parameters:
 *   1. `tools/list` advertises `inputSchema.properties: {}`, so the client is told
 *      the tool takes no arguments and never sends any.
 *   2. Even if a client sent arguments, the SDK's `z.object({})` strips every
 *      undeclared key before the handler runs — so the handler's own Zod
 *      validation sees every field as `undefined`.
 *
 * Numbers are coerced (`z.coerce.number()`) on purpose: MCP clients frequently
 * emit stringified numbers (e.g. `"170"`, `"100.00"`). Coercion lets those pass
 * the SDK-level parse and reach the handler as real numbers, where the domain Zod
 * schema (which expects `z.number()`) then accepts them. Booleans are NOT coerced,
 * because `Boolean("false") === true` would silently invert user intent.
 */

import { z } from "zod";

/** Minimal shape of the JSON-Schema fragments used in tool definitions. */
interface JsonSchemaNode {
  type?: string | string[];
  properties?: Record<string, JsonSchemaNode>;
  required?: string[];
  items?: JsonSchemaNode;
  enum?: unknown[];
  description?: string;
  default?: unknown;
  [keyword: string]: unknown;
}

/** Pick the first concrete type when a node declares a union like `["string","null"]`. */
function primaryType(type: JsonSchemaNode["type"]): string | undefined {
  if (Array.isArray(type)) {
    return type.find((t) => t !== "null") ?? type[0];
  }
  return type;
}

/**
 * Convert a single JSON-Schema node into a Zod type. Lenient by design — anything
 * unrecognized falls back to `z.any()` so we never reject input the handler could
 * have processed. The handler's own schema remains the source of truth.
 */
function convertNode(node: JsonSchemaNode): z.ZodTypeAny {
  // String enums map cleanly to z.enum; anything else stays permissive.
  if (Array.isArray(node.enum) && node.enum.length > 0) {
    const values = node.enum;
    if (values.every((v) => typeof v === "string")) {
      return z.enum(values as [string, ...string[]]);
    }
    return z.any();
  }

  switch (primaryType(node.type)) {
    case "string":
      return z.string();
    case "integer":
      return z.coerce.number().int();
    case "number":
      return z.coerce.number();
    case "boolean":
      return z.boolean();
    case "array": {
      const item = node.items ? convertNode(node.items) : z.any();
      return z.array(item);
    }
    case "object": {
      // Free-form object (no declared properties) → accept any keys.
      if (!node.properties || Object.keys(node.properties).length === 0) {
        return z.record(z.any());
      }
      // Structured object → recurse, but passthrough so undeclared nested keys
      // are preserved rather than stripped.
      return z.object(buildShape(node)).passthrough();
    }
    default:
      return z.any();
  }
}

/** Build a ZodRawShape from an object node's `properties` + `required`. */
function buildShape(node: JsonSchemaNode): z.ZodRawShape {
  const shape: z.ZodRawShape = {};
  const properties = node.properties ?? {};
  const required = new Set(node.required ?? []);

  for (const [key, propNode] of Object.entries(properties)) {
    let zodType = convertNode(propNode);

    if (typeof propNode.description === "string" && propNode.description.length > 0) {
      zodType = zodType.describe(propNode.description);
    }

    // A field with a default is implicitly optional; otherwise honor `required`.
    if (propNode.default !== undefined) {
      zodType = zodType.default(propNode.default);
    } else if (!required.has(key)) {
      zodType = zodType.optional();
    }

    shape[key] = zodType;
  }

  return shape;
}

/**
 * Convert a tool definition's `inputSchema` into a `ZodRawShape` suitable for
 * `McpServer.tool(name, description, shape, handler)`.
 *
 * Returns an empty shape for parameterless tools (or missing/invalid schemas),
 * which is the correct behavior — those tools genuinely take no arguments.
 */
export function jsonSchemaToZodShape(inputSchema: unknown): z.ZodRawShape {
  if (!inputSchema || typeof inputSchema !== "object") {
    return {};
  }
  const node = inputSchema as JsonSchemaNode;
  if (!node.properties || typeof node.properties !== "object") {
    return {};
  }
  return buildShape(node);
}
