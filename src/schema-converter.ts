/**
 * JSON Schema → Zod Shape Converter
 *
 * Converts JSON Schema `inputSchema` from tool definitions into ZodRawShape
 * objects that McpServer.tool() requires. This ensures the MCP protocol
 * exposes the full parameter schema to clients (like Claude Code).
 *
 * Without this, McpServer.tool({}) results in empty `properties: {}` being
 * sent to clients, causing all parameters to be silently dropped.
 */
import { z, type ZodTypeAny } from "zod";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";

type JsonSchemaProperty = {
  type?: string | string[];
  description?: string;
  default?: unknown;
  enum?: string[];
  format?: string;
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
  items?: JsonSchemaProperty;
  maxItems?: number;
};

type JsonSchemaObject = {
  type: "object";
  properties?: Record<string, JsonSchemaProperty>;
  required?: string[];
};

/**
 * Convert a single JSON Schema property to a Zod type.
 */
function jsonPropertyToZod(prop: JsonSchemaProperty): ZodTypeAny {
  // Handle enum first (always string enum in our schemas)
  if (prop.enum && Array.isArray(prop.enum)) {
    const zodEnum = z.enum(prop.enum as [string, ...string[]]);
    return prop.description ? zodEnum.describe(prop.description) : zodEnum;
  }

  // Handle type unions: type: ["string", "number", "boolean"]
  const types = Array.isArray(prop.type) ? prop.type : [prop.type];

  if (types.length > 1) {
    const unionMembers = types.map((t) => primitiveToZod(t));
    if (unionMembers.length >= 2) {
      const union = z.union([
        unionMembers[0] as z.ZodTypeAny,
        unionMembers[1] as z.ZodTypeAny,
        ...unionMembers.slice(2),
      ]);
      return prop.description ? union.describe(prop.description) : union;
    }
  }

  const type = types[0];

  switch (type) {
    case "string": {
      let schema: ZodTypeAny = z.string();
      if (prop.description) schema = (schema as z.ZodString).describe(prop.description);
      return schema;
    }

    case "integer": {
      let schema: ZodTypeAny = z.number();
      if (prop.description) schema = (schema as z.ZodNumber).describe(prop.description);
      return schema;
    }

    case "number": {
      let schema: ZodTypeAny = z.number();
      if (prop.description) schema = (schema as z.ZodNumber).describe(prop.description);
      return schema;
    }

    case "boolean": {
      let schema: ZodTypeAny = z.boolean();
      if (prop.description) schema = (schema as z.ZodBoolean).describe(prop.description);
      return schema;
    }

    case "array": {
      const itemSchema = prop.items ? jsonPropertyToZod(prop.items) : z.any();
      let schema: ZodTypeAny = z.array(itemSchema);
      if (prop.maxItems) schema = (schema as z.ZodArray<ZodTypeAny>).max(prop.maxItems);
      if (prop.description) schema = schema.describe(prop.description);
      return schema;
    }

    case "object": {
      // Object with defined properties → convert recursively
      if (prop.properties && Object.keys(prop.properties).length > 0) {
        const shape: Record<string, ZodTypeAny> = {};
        const required = prop.required ?? [];
        for (const [key, value] of Object.entries(prop.properties)) {
          let fieldSchema = jsonPropertyToZod(value);
          if (!required.includes(key)) {
            fieldSchema = fieldSchema.optional();
          }
          shape[key] = fieldSchema;
        }
        let schema: ZodTypeAny = z.object(shape);
        if (prop.description) schema = schema.describe(prop.description);
        return schema;
      }
      // Generic object (no properties defined) → passthrough
      let schema: ZodTypeAny = z.record(z.any());
      if (prop.description) schema = schema.describe(prop.description);
      return schema;
    }

    default: {
      // No type or unknown type → z.any()
      let schema: ZodTypeAny = z.any();
      if (prop.description) schema = schema.describe(prop.description);
      return schema;
    }
  }
}

function primitiveToZod(type: string | undefined): ZodTypeAny {
  switch (type) {
    case "string":
      return z.string();
    case "integer":
    case "number":
      return z.number();
    case "boolean":
      return z.boolean();
    default:
      return z.any();
  }
}

/**
 * Convert a tool's inputSchema to a ZodRawShape for McpServer.tool().
 *
 * @param def - The tool definition with inputSchema
 * @returns A ZodRawShape (flat object of { key: ZodType }) suitable for McpServer.tool()
 */
export function toZodShape(def: Tool): Record<string, ZodTypeAny> {
  const schema = def.inputSchema as JsonSchemaObject;
  if (!schema?.properties || Object.keys(schema.properties).length === 0) {
    return {};
  }

  const required = schema.required ?? [];
  const shape: Record<string, ZodTypeAny> = {};

  for (const [key, prop] of Object.entries(schema.properties)) {
    let zodType = jsonPropertyToZod(prop);
    if (!required.includes(key)) {
      zodType = zodType.optional();
    }
    shape[key] = zodType;
  }

  return shape;
}
