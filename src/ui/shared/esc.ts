/**
 * Escape a value for interpolation into HTML text or a double-quoted attribute.
 *
 * The panels build their markup with innerHTML from bexio data (contact names, invoice
 * titles, position texts, addresses). That data is not always typed by the user: it
 * can come from suppliers, imports or other users of the mandate. Unescaped, a name
 * like `<img src=x onerror=...>` would run script inside the panel, which holds a live
 * MCP Apps bridge to the host. Every data value goes through esc().
 */
const ENTITIES: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

export function esc(value: unknown): string {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ENTITIES[c]);
}
