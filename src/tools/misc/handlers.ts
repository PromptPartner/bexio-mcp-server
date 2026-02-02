/**
 * Misc tool handlers.
 * Implements the logic for comments and contact relations.
 */

import { BexioClient } from "../../bexio-client.js";
import { McpError } from "../../shared/errors.js";
import {
  GetCommentParamsSchema,
  CreateCommentParamsSchema,
  GetContactRelationParamsSchema,
  CreateContactRelationParamsSchema,
  UpdateContactRelationParamsSchema,
  DeleteContactRelationParamsSchema,
  SearchContactRelationsParamsSchema,
} from "../../types/index.js";

export type HandlerFn = (
  client: BexioClient,
  args: unknown
) => Promise<unknown>;

export const handlers: Record<string, HandlerFn> = {
  // Comments
  list_comments: async (client) => {
    return client.listComments();
  },

  get_comment: async (client, args) => {
    const { comment_id } = GetCommentParamsSchema.parse(args);
    const comment = await client.getComment(comment_id);
    if (!comment) {
      throw McpError.notFound("Comment", comment_id);
    }
    return comment;
  },

  create_comment: async (client, args) => {
    const { comment_data } = CreateCommentParamsSchema.parse(args);
    return client.createComment(comment_data);
  },

  // Contact Relations
  list_contact_relations: async (client) => {
    return client.listContactRelations();
  },

  get_contact_relation: async (client, args) => {
    const { relation_id } = GetContactRelationParamsSchema.parse(args);
    const relation = await client.getContactRelation(relation_id);
    if (!relation) {
      throw McpError.notFound("Contact Relation", relation_id);
    }
    return relation;
  },

  create_contact_relation: async (client, args) => {
    const { relation_data } = CreateContactRelationParamsSchema.parse(args);
    return client.createContactRelation(relation_data);
  },

  update_contact_relation: async (client, args) => {
    const { relation_id, relation_data } =
      UpdateContactRelationParamsSchema.parse(args);
    return client.updateContactRelation(relation_id, relation_data);
  },

  delete_contact_relation: async (client, args) => {
    const { relation_id } = DeleteContactRelationParamsSchema.parse(args);
    return client.deleteContactRelation(relation_id);
  },

  search_contact_relations: async (client, args) => {
    const { search_params } = SearchContactRelationsParamsSchema.parse(args);
    return client.searchContactRelations(search_params);
  },
};
