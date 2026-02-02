/**
 * Reference data tool handlers.
 * Implements the logic for each reference data tool.
 */

import { BexioClient } from "../../bexio-client.js";
import { McpError } from "../../shared/errors.js";
import {
  // Contact Groups
  ListContactGroupsParamsSchema,
  GetContactGroupParamsSchema,
  CreateContactGroupParamsSchema,
  DeleteContactGroupParamsSchema,
  // Contact Sectors
  ListContactSectorsParamsSchema,
  GetContactSectorParamsSchema,
  CreateContactSectorParamsSchema,
  // Salutations
  ListSalutationsParamsSchema,
  GetSalutationParamsSchema,
  CreateSalutationParamsSchema,
  DeleteSalutationParamsSchema,
  // Titles
  ListTitlesParamsSchema,
  GetTitleParamsSchema,
  CreateTitleParamsSchema,
  DeleteTitleParamsSchema,
  // Countries
  ListCountriesParamsSchema,
  GetCountryParamsSchema,
  CreateCountryParamsSchema,
  DeleteCountryParamsSchema,
  // Languages
  ListLanguagesParamsSchema,
  GetLanguageParamsSchema,
  CreateLanguageParamsSchema,
  // Units
  ListUnitsParamsSchema,
  GetUnitParamsSchema,
  CreateUnitParamsSchema,
  DeleteUnitParamsSchema,
} from "../../types/index.js";

export type HandlerFn = (
  client: BexioClient,
  args: unknown
) => Promise<unknown>;

export const handlers: Record<string, HandlerFn> = {
  // ===== CONTACT GROUPS (REFDATA-01) =====
  list_contact_groups: async (client, args) => {
    const params = ListContactGroupsParamsSchema.parse(args);
    return client.listContactGroups(params);
  },

  get_contact_group: async (client, args) => {
    const { group_id } = GetContactGroupParamsSchema.parse(args);
    const group = await client.getContactGroup(group_id);
    if (!group) {
      throw McpError.notFound("Contact Group", group_id);
    }
    return group;
  },

  create_contact_group: async (client, args) => {
    const { name } = CreateContactGroupParamsSchema.parse(args);
    return client.createContactGroup({ name });
  },

  delete_contact_group: async (client, args) => {
    const { group_id } = DeleteContactGroupParamsSchema.parse(args);
    return client.deleteContactGroup(group_id);
  },

  // ===== CONTACT SECTORS (REFDATA-02) =====
  list_contact_sectors: async (client, args) => {
    const params = ListContactSectorsParamsSchema.parse(args);
    return client.listContactSectors(params);
  },

  get_contact_sector: async (client, args) => {
    const { sector_id } = GetContactSectorParamsSchema.parse(args);
    const sector = await client.getContactSector(sector_id);
    if (!sector) {
      throw McpError.notFound("Contact Sector", sector_id);
    }
    return sector;
  },

  create_contact_sector: async (client, args) => {
    const { name } = CreateContactSectorParamsSchema.parse(args);
    return client.createContactSector({ name });
  },

  // ===== SALUTATIONS (REFDATA-03) =====
  list_salutations: async (client, args) => {
    const params = ListSalutationsParamsSchema.parse(args);
    return client.listSalutations(params);
  },

  get_salutation: async (client, args) => {
    const { salutation_id } = GetSalutationParamsSchema.parse(args);
    const salutation = await client.getSalutation(salutation_id);
    if (!salutation) {
      throw McpError.notFound("Salutation", salutation_id);
    }
    return salutation;
  },

  create_salutation: async (client, args) => {
    const { name } = CreateSalutationParamsSchema.parse(args);
    return client.createSalutation({ name });
  },

  delete_salutation: async (client, args) => {
    const { salutation_id } = DeleteSalutationParamsSchema.parse(args);
    return client.deleteSalutation(salutation_id);
  },

  // ===== TITLES (REFDATA-04) =====
  list_titles: async (client, args) => {
    const params = ListTitlesParamsSchema.parse(args);
    return client.listTitles(params);
  },

  get_title: async (client, args) => {
    const { title_id } = GetTitleParamsSchema.parse(args);
    const title = await client.getTitle(title_id);
    if (!title) {
      throw McpError.notFound("Title", title_id);
    }
    return title;
  },

  create_title: async (client, args) => {
    const { name } = CreateTitleParamsSchema.parse(args);
    return client.createTitle({ name });
  },

  delete_title: async (client, args) => {
    const { title_id } = DeleteTitleParamsSchema.parse(args);
    return client.deleteTitle(title_id);
  },

  // ===== COUNTRIES (REFDATA-05) =====
  list_countries: async (client, args) => {
    const params = ListCountriesParamsSchema.parse(args);
    return client.listCountries(params);
  },

  get_country: async (client, args) => {
    const { country_id } = GetCountryParamsSchema.parse(args);
    const country = await client.getCountry(country_id);
    if (!country) {
      throw McpError.notFound("Country", country_id);
    }
    return country;
  },

  create_country: async (client, args) => {
    const { name, iso_3166_alpha2 } = CreateCountryParamsSchema.parse(args);
    return client.createCountry({ name, iso_3166_alpha2 });
  },

  delete_country: async (client, args) => {
    const { country_id } = DeleteCountryParamsSchema.parse(args);
    return client.deleteCountry(country_id);
  },

  // ===== LANGUAGES (REFDATA-06) =====
  list_languages: async (client, args) => {
    const params = ListLanguagesParamsSchema.parse(args);
    return client.listLanguages(params);
  },

  get_language: async (client, args) => {
    const { language_id } = GetLanguageParamsSchema.parse(args);
    const language = await client.getLanguage(language_id);
    if (!language) {
      throw McpError.notFound("Language", language_id);
    }
    return language;
  },

  create_language: async (client, args) => {
    const { name, iso_639_1 } = CreateLanguageParamsSchema.parse(args);
    return client.createLanguage({ name, iso_639_1 });
  },

  // ===== UNITS (REFDATA-07) =====
  list_units: async (client, args) => {
    const params = ListUnitsParamsSchema.parse(args);
    return client.listUnits(params);
  },

  get_unit: async (client, args) => {
    const { unit_id } = GetUnitParamsSchema.parse(args);
    const unit = await client.getUnit(unit_id);
    if (!unit) {
      throw McpError.notFound("Unit", unit_id);
    }
    return unit;
  },

  create_unit: async (client, args) => {
    const { name } = CreateUnitParamsSchema.parse(args);
    return client.createUnit({ name });
  },

  delete_unit: async (client, args) => {
    const { unit_id } = DeleteUnitParamsSchema.parse(args);
    return client.deleteUnit(unit_id);
  },
};
