/**
 * Position tool handlers.
 * Implements logic for all 35 position tools (7 types x 5 operations).
 * Uses programmatic generation matching the definitions pattern.
 */

import { BexioClient } from "../../bexio-client.js";
import { McpError } from "../../shared/errors.js";
import {
  ListPositionsParamsSchema,
  GetPositionParamsSchema,
  CreatePositionParamsSchema,
  EditPositionParamsSchema,
  DeletePositionParamsSchema,
  DOCUMENT_TYPE_MAP,
  POSITION_TYPE_MAP,
} from "../../types/index.js";

export type HandlerFn = (
  client: BexioClient,
  args: unknown
) => Promise<unknown>;

/** All 7 position type keys matching POSITION_TYPE_MAP */
const POSITION_KEYS = [
  "default",
  "item",
  "text",
  "subtotal",
  "discount",
  "pagebreak",
  "sub",
] as const;

/** Position types that don't accept a JSON body (Bexio returns 415 if body is sent) */
const BODYLESS_POSITION_TYPES = new Set(["subtotal", "pagebreak"]);

/**
 * Generate 5 handler functions for a single position type.
 */
function makePositionHandlers(posKey: string): Record<string, HandlerFn> {
  return {
    [`list_${posKey}_positions`]: async (client, args) => {
      const { document_type, document_id } =
        ListPositionsParamsSchema.parse(args);
      const docType = DOCUMENT_TYPE_MAP[document_type];
      return client.listPositions(
        docType,
        document_id,
        POSITION_TYPE_MAP[posKey],
      );
    },

    [`get_${posKey}_position`]: async (client, args) => {
      const { document_type, document_id, position_id } =
        GetPositionParamsSchema.parse(args);
      const docType = DOCUMENT_TYPE_MAP[document_type];
      const result = await client.getPosition(
        docType,
        document_id,
        POSITION_TYPE_MAP[posKey],
        position_id,
      );
      if (!result) {
        throw McpError.notFound(`${posKey} position`, position_id);
      }
      return result;
    },

    [`create_${posKey}_position`]: async (client, args) => {
      const { document_type, document_id, position_data } =
        CreatePositionParamsSchema.parse(args);
      const docType = DOCUMENT_TYPE_MAP[document_type];
      // Subtotal needs {text: "..."}, pagebreak needs non-empty body like {pagebreak: true}
      if (posKey === "subtotal") {
        const data = { text: position_data?.text || "Subtotal", ...position_data };
        return client.createPosition(docType, document_id, POSITION_TYPE_MAP[posKey], data);
      }
      if (posKey === "pagebreak") {
        return client.createPosition(docType, document_id, POSITION_TYPE_MAP[posKey], { pagebreak: true });
      }
      return client.createPosition(
        docType,
        document_id,
        POSITION_TYPE_MAP[posKey],
        position_data,
      );
    },

    [`edit_${posKey}_position`]: async (client, args) => {
      const { document_type, document_id, position_id, position_data } =
        EditPositionParamsSchema.parse(args);
      const docType = DOCUMENT_TYPE_MAP[document_type];
      return client.editPosition(
        docType,
        document_id,
        POSITION_TYPE_MAP[posKey],
        position_id,
        position_data,
      );
    },

    [`delete_${posKey}_position`]: async (client, args) => {
      const { document_type, document_id, position_id } =
        DeletePositionParamsSchema.parse(args);
      const docType = DOCUMENT_TYPE_MAP[document_type];
      return client.deletePosition(
        docType,
        document_id,
        POSITION_TYPE_MAP[posKey],
        position_id,
      );
    },
  };
}

export const handlers: Record<string, HandlerFn> = Object.assign(
  {},
  ...POSITION_KEYS.map(makePositionHandlers),
);
