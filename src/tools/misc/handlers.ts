/**
 * Misc tool handlers.
 * Implements the logic for comments and contact relations.
 */

import { BexioClient } from "../../bexio-client.js";
import { McpError } from "../../shared/errors.js";
import {
  ListCommentsParamsSchema,
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
  // Comments (nested under document type)
  list_comments: async (client, args) => {
    const { document_type, document_id } = ListCommentsParamsSchema.parse(args);
    return client.listComments(document_type, document_id);
  },

  get_comment: async (client, args) => {
    const { document_type, document_id, comment_id } = GetCommentParamsSchema.parse(args);
    const comment = await client.getComment(document_type, document_id, comment_id);
    if (!comment) {
      throw McpError.notFound("Comment", comment_id);
    }
    return comment;
  },

  create_comment: async (client, args) => {
    const { document_type, document_id, comment_data } = CreateCommentParamsSchema.parse(args);
    return client.createComment(document_type, document_id, comment_data);
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
    const params = SearchContactRelationsParamsSchema.parse(args);
    const searchFilters: Array<{ field: string; operator: string; value: unknown }> = [];

    if (params.filters) {
      if (!Array.isArray(params.filters)) {
        throw McpError.validation("filters must be a list of search expressions");
      }
      searchFilters.push(...params.filters as Array<{ field: string; operator: string; value: unknown }>);
    }

    if (params.query !== undefined) {
      const op = params.operator?.toUpperCase() ?? "=";
      searchFilters.push({
        field: params.field ?? "contact_id",
        operator: op,
        value: params.query,
      });
    }

    if (searchFilters.length === 0) {
      throw McpError.validation("Either query or filters must be provided");
    }

    const queryParams = params.limit ? { limit: params.limit } : undefined;
    return client.searchContactRelations(searchFilters, queryParams);
  },
};
