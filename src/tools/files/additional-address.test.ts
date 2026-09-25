import { describe, it, expect } from "vitest";
import { handlers } from "./handlers.js";

/**
 * Same defect as #17, on additional addresses: bexio's fields are street_name +
 * house_number (+ address_addition, name_addition). create_additional_address
 * advertised street_name/house_number but its schema stripped them (it only knew
 * `address`), and update_additional_address advertised `address`, which bexio rejects.
 */
function captureClient() {
  const sent: Array<{ method: string; payload: unknown }> = [];
  const client = {
    createAdditionalAddress: async (_c: number, payload: unknown) => (sent.push({ method: "create", payload }), { id: 1 }),
    updateAdditionalAddress: async (_c: number, _a: number, payload: unknown) => (
      sent.push({ method: "update", payload }), { id: 1 }
    ),
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { client: client as any, sent };
}

describe("additional address street fields", () => {
  it("create forwards street_name / house_number / address_addition / name_addition", async () => {
    const { client, sent } = captureClient();
    await handlers.create_additional_address(client, {
      contact_id: 1,
      address_data: {
        name: "Lager",
        name_addition: "Halle 2",
        street_name: "Industriestrasse",
        house_number: "7",
        address_addition: "Rampe B",
        postcode: "6300",
        city: "Zug",
      },
    });
    expect(sent[0].payload).toMatchObject({
      name_addition: "Halle 2",
      street_name: "Industriestrasse",
      house_number: "7",
      address_addition: "Rampe B",
    });
  });

  it("update maps a deprecated address onto street_name + house_number", async () => {
    const { client, sent } = captureClient();
    await handlers.update_additional_address(client, { contact_id: 1, address_id: 2, address_data: { address: "Seeweg 3" } });
    expect(sent[0].payload).toEqual({ street_name: "Seeweg", house_number: "3" });
  });
});
