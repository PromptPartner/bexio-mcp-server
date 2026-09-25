import { describe, it, expect } from "vitest";
import { handlers } from "./handlers.js";
import { splitStreetAddress } from "../../types/schemas/contacts.js";

/**
 * bexio's contact API has street_name + house_number (+ address_addition); it has no
 * `address` field and rejects one with an empty 422 (#17). The tools advertised only
 * `address`, and the create schema stripped street_name/house_number as unknown keys,
 * so a street could not be set at all.
 */
function captureClient() {
  const sent: Array<{ method: string; payload: unknown }> = [];
  const client = {
    createContact: async (payload: unknown) => (sent.push({ method: "createContact", payload }), { id: 1 }),
    bulkCreateContacts: async (payload: unknown) => (sent.push({ method: "bulkCreateContacts", payload }), []),
    updateContact: async (_id: number, payload: unknown) => (sent.push({ method: "updateContact", payload }), { id: 1 }),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { client: client as any, sent };
}

describe("splitStreetAddress", () => {
  it.each([
    ["Bahnhofstrasse 12", "Bahnhofstrasse", "12"],
    ["Bahnhofstrasse 12a", "Bahnhofstrasse", "12a"],
    ["Rue du Lac 3-5", "Rue du Lac", "3-5"],
    ["Hauptstr. 7 B", "Hauptstr.", "7 B"],
    ["Postfach", "Postfach", undefined],
    ["12 Main Street", "12 Main Street", undefined],
  ])("%s", (input, street, number) => {
    expect(splitStreetAddress(input)).toEqual({ street_name: street, house_number: number });
  });
});

describe("contact street fields", () => {
  it("create_contact forwards street_name / house_number / address_addition", async () => {
    const { client, sent } = captureClient();
    await handlers.create_contact(client, {
      contact_type: "company",
      name_1: "Muster AG",
      street_name: "Bahnhofstrasse",
      house_number: "12",
      address_addition: "c/o Finance",
    });
    expect(sent[0].payload).toMatchObject({
      street_name: "Bahnhofstrasse",
      house_number: "12",
      address_addition: "c/o Finance",
    });
  });

  it("create_contact maps the deprecated address onto street_name + house_number", async () => {
    const { client, sent } = captureClient();
    await handlers.create_contact(client, { contact_type: "company", name_1: "Muster AG", address: "Bahnhofstrasse 12a" });
    expect(sent[0].payload).toMatchObject({ street_name: "Bahnhofstrasse", house_number: "12a" });
    expect(sent[0].payload).not.toHaveProperty("address");
  });

  it("explicit street_name wins over address", async () => {
    const { client, sent } = captureClient();
    await handlers.create_contact(client, {
      contact_type: "person",
      name_1: "Muster",
      address: "Old Street 1",
      street_name: "New Street",
      house_number: "2",
    });
    expect(sent[0].payload).toMatchObject({ street_name: "New Street", house_number: "2" });
    expect(sent[0].payload).not.toHaveProperty("address");
  });

  it("bulk_create_contacts maps address per contact", async () => {
    const { client, sent } = captureClient();
    await handlers.bulk_create_contacts(client, {
      contacts: [
        { contact_type: "company", name_1: "A", address: "Seestrasse 5" },
        { contact_type: "company", name_1: "B", street_name: "Weg", house_number: "1" },
      ],
    });
    const [a, b] = sent[0].payload as Array<Record<string, unknown>>;
    expect(a).toMatchObject({ street_name: "Seestrasse", house_number: "5" });
    expect(a).not.toHaveProperty("address");
    expect(b).toMatchObject({ street_name: "Weg", house_number: "1" });
  });

  it("update_contact maps address in contact_data too", async () => {
    const { client, sent } = captureClient();
    await handlers.update_contact(client, { contact_id: 1, contact_data: { address: "Seestrasse 5", city: "Zug" } });
    expect(sent[0].payload).toEqual({ street_name: "Seestrasse", house_number: "5", city: "Zug" });
  });
});
