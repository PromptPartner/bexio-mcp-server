import { describe, it, expect, vi, afterEach } from "vitest";
import axios from "axios";
import { BexioClient } from "./bexio-client.js";
import { bexioErrorMessage } from "./shared/errors.js";

/**
 * bexio puts the useful part of a validation failure in `errors`; `message` alone is
 * often just "The form could not be saved due to the following errors:". Dropping
 * `errors` turned every 422 into a content-free string (#19, #17), and the binary /
 * multipart endpoints surfaced bexio errors as a bare "Request failed with status
 * code 415" (#20).
 */
const FORM_422 = {
  error_code: 422,
  message: "The form could not be saved due to the following errors:",
  errors: ["Widget schema does not include the following field(s): esr_id, qr_invoice_id"],
};

describe("bexioErrorMessage", () => {
  it("appends a string errors[] to the message without the dangling colon", () => {
    expect(bexioErrorMessage(FORM_422, "Unprocessable Entity")).toBe(
      "The form could not be saved due to the following errors: Widget schema does not include the following field(s): esr_id, qr_invoice_id"
    );
  });

  it("formats field/message objects", () => {
    const body = { message: "validation failed", errors: [{ field: "currency_id", message: "must not be null" }] };
    expect(bexioErrorMessage(body, "x")).toBe("validation failed: currency_id: must not be null");
  });

  it("formats a field -> messages map", () => {
    const body = { message: "Invalid", errors: { street_name: ["is required"], postcode: ["too long", "invalid"] } };
    expect(bexioErrorMessage(body, "x")).toBe("Invalid: street_name: is required; postcode: too long, invalid");
  });

  it("keeps the message alone when errors is empty", () => {
    expect(bexioErrorMessage({ message: "The form could not be saved due to the following errors:", errors: [] }, "x")).toBe(
      "The form could not be saved due to the following errors:"
    );
  });

  it("decodes a JSON body delivered as a Buffer (arraybuffer endpoints)", () => {
    const buf = Buffer.from(JSON.stringify({ message: "You did not specify a valid Accept-Header" }));
    expect(bexioErrorMessage(buf, "Unsupported Media Type")).toBe("You did not specify a valid Accept-Header");
  });

  it("falls back to the status text for a non-JSON body", () => {
    expect(bexioErrorMessage("<html>Bad gateway</html>", "Bad Gateway")).toBe("Bad Gateway");
    expect(bexioErrorMessage(undefined, "Not Found")).toBe("Not Found");
  });
});

function axiosError(status: number, data: unknown, statusText = "Unprocessable Entity") {
  return Object.assign(new Error(`Request failed with status code ${status}`), {
    isAxiosError: true,
    response: { status, statusText, data, headers: {}, config: {} },
    config: { url: "/kb_invoice/1", method: "post" },
    request: {},
  });
}

describe("BexioClient surfaces bexio's error details on every transport path", () => {
  afterEach(() => vi.restoreAllMocks());
  const DETAIL = "Widget schema does not include the following field(s): esr_id, qr_invoice_id";

  it("v2.0 requests (shared axios instance)", async () => {
    const client = new BexioClient({ apiToken: "t", baseUrl: "https://api.bexio.com/2.0" } as never);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rejected = (client as any).client.interceptors.response.handlers[0].rejected;
    expect(() => rejected(axiosError(422, FORM_422))).toThrow(DETAIL);
  });

  it("v3.0/v4.0 requests (makeVersionedRequest)", async () => {
    vi.spyOn(axios, "request").mockRejectedValue(axiosError(422, FORM_422));
    const client = new BexioClient({ apiToken: "t" } as never);
    await expect(client.getJournalPage({})).rejects.toThrow(DETAIL);
  });

  it("file upload", async () => {
    vi.spyOn(axios, "post").mockRejectedValue(
      axiosError(415, { message: "You did not specify a valid Accept-Header" }, "Unsupported Media Type")
    );
    const client = new BexioClient({ apiToken: "t" } as never);
    await expect(
      client.uploadFile({ name: "a.txt", content_base64: "YQ==", content_type: "text/plain" })
    ).rejects.toMatchObject({ code: "BEXIO_API_ERROR", statusCode: 415 });
  });

  it("file download (arraybuffer error body)", async () => {
    vi.spyOn(axios, "get").mockRejectedValue(
      axiosError(404, Buffer.from(JSON.stringify({ message: "File not found" })), "Not Found")
    );
    const client = new BexioClient({ apiToken: "t" } as never);
    await expect(client.downloadFile(99)).rejects.toThrow("File not found");
  });
});
