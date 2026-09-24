/**
 * Logger module that ONLY writes to stderr.
 *
 * CRITICAL: MCP protocol uses stdout for JSON-RPC messages.
 * Any non-JSON output to stdout corrupts the protocol.
 * All logging MUST go to stderr via console.error().
 */

function formatTimestamp(): string {
  return new Date().toISOString();
}

// Once stderr's reader is gone, every write fails with EPIPE. Logging that failure
// writes to the same dead stream and fails again - a self-sustaining loop that
// pinned a CPU core in orphaned servers (#18). After stderr dies, stop writing.
let silenced = false;

/** Stop all logging: stderr is dead (index.ts calls this on EPIPE/EIO). */
export function silenceLogger(): void {
  silenced = true;
}

function write(line: string, args: unknown[]): void {
  if (silenced) return;
  try {
    console.error(line, ...args);
  } catch {
    silenced = true;
  }
}

export function debug(message: string, ...args: unknown[]): void {
  write(`[DEBUG] ${formatTimestamp()} ${message}`, args);
}

export function info(message: string, ...args: unknown[]): void {
  write(`[INFO] ${formatTimestamp()} ${message}`, args);
}

export function warn(message: string, ...args: unknown[]): void {
  write(`[WARN] ${formatTimestamp()} ${message}`, args);
}

export function error(message: string, ...args: unknown[]): void {
  write(`[ERROR] ${formatTimestamp()} ${message}`, args);
}

export const logger = {
  debug,
  info,
  warn,
  error,
};
