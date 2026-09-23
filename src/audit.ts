/**
 * Audit log for gateway mode: one JSON line per tool call on stderr.
 *
 * Several people may act through the same Bexio login (e.g. "backoffice"), so
 * Bexio's own history cannot tell them apart. This log records who called which
 * tool. Arguments and results are deliberately not logged (personal/financial data).
 */

import type { SessionContext } from "./server.js";

export function auditToolCall(
  context: SessionContext,
  tool: string,
  startedAt: number,
  error?: unknown
): void {
  const entry = {
    ts: new Date().toISOString(),
    client: context.clientName,
    connection: context.connection,
    tool,
    ok: error === undefined,
    duration_ms: Date.now() - startedAt,
    ...(error !== undefined
      ? { error: (error instanceof Error ? error.message : String(error)).slice(0, 300) }
      : {}),
  };
  console.error(`[AUDIT] ${JSON.stringify(entry)}`);
}
