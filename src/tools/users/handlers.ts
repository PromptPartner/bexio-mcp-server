/**
 * User tool handlers.
 * Implements the logic for each user tool.
 */

import { BexioClient } from "../../bexio-client.js";
import { McpError } from "../../shared/errors.js";
import {
  ListFictionalUsersParamsSchema,
  GetFictionalUserParamsSchema,
  CreateFictionalUserParamsSchema,
  UpdateFictionalUserParamsSchema,
  DeleteFictionalUserParamsSchema,
} from "../../types/index.js";

export type HandlerFn = (
  client: BexioClient,
  args: unknown
) => Promise<unknown>;

export const handlers: Record<string, HandlerFn> = {
  get_current_user: async (client) => {
    return client.getCurrentUser();
  },

  list_fictional_users: async (client, args) => {
    const params = ListFictionalUsersParamsSchema.parse(args);
    return client.listFictionalUsers(params);
  },

  get_fictional_user: async (client, args) => {
    const { user_id } = GetFictionalUserParamsSchema.parse(args);
    const user = await client.getFictionalUser(user_id);
    if (!user) {
      throw McpError.notFound("Fictional User", user_id);
    }
    return user;
  },

  create_fictional_user: async (client, args) => {
    const { user_data } = CreateFictionalUserParamsSchema.parse(args);
    return client.createFictionalUser(user_data);
  },

  update_fictional_user: async (client, args) => {
    const { user_id, user_data } = UpdateFictionalUserParamsSchema.parse(args);
    return client.updateFictionalUser(user_id, user_data);
  },

  delete_fictional_user: async (client, args) => {
    const { user_id } = DeleteFictionalUserParamsSchema.parse(args);
    return client.deleteFictionalUser(user_id);
  },
};
