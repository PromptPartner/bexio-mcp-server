/**
 * Contact tool handlers.
 * Implements the logic for each contact tool.
 */

import { BexioClient } from "../../bexio-client.js";
import { McpError } from "../../shared/errors.js";
import {
  ListContactsParamsSchema,
  GetContactParamsSchema,
  SearchContactsParamsSchema,
  AdvancedSearchContactsParamsSchema,
  FindContactByNumberParamsSchema,
  FindContactByNameParamsSchema,
  UpdateContactParamsSchema,
  CreateContactParamsSchema,
  DeleteContactParamsSchema,
  BulkCreateContactsParamsSchema,
  RestoreContactParamsSchema,
} from "../../types/index.js";

export type HandlerFn = (
  client: BexioClient,
  args: unknown
) => Promise<unknown>;

export const handlers: Record<string, HandlerFn> = {
  list_contacts: async (client, args) => {
    const params = ListContactsParamsSchema.parse(args);
    return client.listContacts(params);
  },

  get_contact: async (client, args) => {
    const { contact_id } = GetContactParamsSchema.parse(args);
    const contact = await client.getContact(contact_id);
    if (!contact) {
      throw McpError.notFound("Contact", contact_id);
    }
    return contact;
  },

  search_contacts: async (client, args) => {
    const { query, limit } = SearchContactsParamsSchema.parse(args);
    return client.searchContacts(query, limit);
  },

  advanced_search_contacts: async (client, args) => {
    const { search_criteria, limit } =
      AdvancedSearchContactsParamsSchema.parse(args);
    return client.advancedSearchContacts(search_criteria, limit);
  },

  find_contact_by_number: async (client, args) => {
    const { contact_number } = FindContactByNumberParamsSchema.parse(args);
    return client.findContactByNumber(contact_number);
  },

  find_contact_by_name: async (client, args) => {
    const { name } = FindContactByNameParamsSchema.parse(args);
    return client.findContactByName(name);
  },

  update_contact: async (client, args) => {
    const { contact_id, contact_data } = UpdateContactParamsSchema.parse(args);
    return client.updateContact(contact_id, contact_data);
  },

  create_contact: async (client, args) => {
    const { contact_type, ...fields } = CreateContactParamsSchema.parse(args);
    const contact_type_id = contact_type === "company" ? 1 : 2;
    // user_id and owner_id are required by the bexio API — default to 1 if not provided
    const user_id = fields.user_id ?? 1;
    const owner_id = (fields as Record<string, unknown>).owner_id ?? user_id;
    return client.createContact({ contact_type_id, ...fields, user_id, owner_id });
  },

  delete_contact: async (client, args) => {
    const { contact_id } = DeleteContactParamsSchema.parse(args);
    await client.deleteContact(contact_id);
    return { success: true, message: `Contact ${contact_id} deleted` };
  },

  bulk_create_contacts: async (client, args) => {
    const { contacts } = BulkCreateContactsParamsSchema.parse(args);
    const mappedContacts = contacts.map(({ contact_type, ...fields }) => {
      const user_id = fields.user_id ?? 1;
      const owner_id = (fields as Record<string, unknown>).owner_id ?? user_id;
      return { contact_type_id: contact_type === "company" ? 1 : 2, ...fields, user_id, owner_id };
    });
    return client.bulkCreateContacts(mappedContacts);
  },

  restore_contact: async (client, args) => {
    const { contact_id } = RestoreContactParamsSchema.parse(args);
    return client.restoreContact(contact_id);
  },
};
