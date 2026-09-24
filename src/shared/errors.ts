/**
 * McpError class for standardized error handling.
 * Error messages include recovery suggestions for LLM self-correction.
 */

export type McpErrorCode =
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "BEXIO_API_ERROR"
  | "INTERNAL_ERROR";

export class McpError extends Error {
  readonly code: McpErrorCode;
  readonly details?: Record<string, unknown>;
  readonly statusCode?: number;

  constructor(
    code: McpErrorCode,
    message: string,
    details?: Record<string, unknown>,
    statusCode?: number
  ) {
    super(message);
    this.name = "McpError";
    this.code = code;
    this.details = details;
    this.statusCode = statusCode;
  }

  /** Resource not found - suggests listing resources first */
  static notFound(resource: string, id: string | number): McpError {
    return new McpError(
      "NOT_FOUND",
      `${resource} with ID ${id} not found. Try listing ${resource.toLowerCase()}s first to find valid IDs.`,
      { resource, id }
    );
  }

  /** Validation error - includes specific field issues */
  static validation(message: string, details?: Record<string, unknown>): McpError {
    return new McpError(
      "VALIDATION_ERROR",
      `Validation failed: ${message}. Check the required fields and their formats.`,
      details
    );
  }

  /** Bexio API error - includes status and recovery suggestions */
  static bexioApi(
    message: string,
    statusCode?: number,
    details?: Record<string, unknown>
  ): McpError {
    let suggestion = "";
    if (statusCode === 401) {
      suggestion = " Check that BEXIO_API_TOKEN is valid and not expired.";
    } else if (statusCode === 403) {
      suggestion = " The API token may lack permissions for this operation.";
    } else if (statusCode === 429) {
      suggestion = " Rate limit exceeded. Wait a moment before retrying.";
    } else if (statusCode && statusCode >= 500) {
      suggestion = " Bexio server error. Retry the request in a few seconds.";
    }

    return new McpError(
      "BEXIO_API_ERROR",
      `Bexio API error: ${message}.${suggestion}`,
      details,
      statusCode
    );
  }

  /** Internal server error */
  static internal(message: string, details?: Record<string, unknown>): McpError {
    return new McpError(
      "INTERNAL_ERROR",
      `Internal error: ${message}. Please report this issue.`,
      details
    );
  }

  /** Convert to plain object for JSON serialization */
  toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      message: this.message,
      details: this.details,
      statusCode: this.statusCode,
    };
  }
}

const MAX_ERROR_DETAIL = 1000;

function formatErrorItem(item: unknown): string {
  if (typeof item === "string") return item;
  if (item && typeof item === "object") {
    const o = item as Record<string, unknown>;
    const text = o["message"] ?? o["error"];
    const field = o["field"] ?? o["property"] ?? o["path"];
    if (typeof text === "string") return typeof field === "string" ? `${field}: ${text}` : text;
  }
  return JSON.stringify(item);
}

/**
 * Build a readable message from a bexio error body.
 *
 * bexio puts the useful part of a validation failure in `errors` - a list of strings,
 * a list of {field, message} objects, or a field -> messages map - while `message`
 * alone is often just "The form could not be saved due to the following errors:".
 * Binary endpoints deliver the body as a Buffer, and gateways can answer with HTML;
 * both are handled, falling back to the HTTP status text.
 */
export function bexioErrorMessage(body: unknown, fallback: string): string {
  let data = body;
  if (Buffer.isBuffer(data) || data instanceof ArrayBuffer) {
    data = Buffer.from(data as Buffer).toString("utf-8");
  }
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      return fallback;
    }
  }
  if (!data || typeof data !== "object") return fallback;

  const o = data as Record<string, unknown>;
  const message = typeof o["message"] === "string" && o["message"] ? o["message"] : fallback;
  const errors = o["errors"];

  let detail = "";
  if (Array.isArray(errors)) {
    detail = errors.map(formatErrorItem).filter(Boolean).join("; ");
  } else if (errors && typeof errors === "object") {
    detail = Object.entries(errors as Record<string, unknown>)
      .map(([field, v]) => `${field}: ${Array.isArray(v) ? v.map(formatErrorItem).join(", ") : formatErrorItem(v)}`)
      .join("; ");
  }
  if (!detail) return message;
  if (detail.length > MAX_ERROR_DETAIL) detail = `${detail.slice(0, MAX_ERROR_DETAIL)}…`;
  return `${message.replace(/[\s:.]+$/, "")}: ${detail}`;
}
