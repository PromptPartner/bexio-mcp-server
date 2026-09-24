import { describe, it, expect, vi, afterEach } from "vitest";

/**
 * #18: with stderr's reader gone, console.error throws EPIPE. The logger must swallow
 * that and stop writing, so logging a failure can never cause the next failure.
 */
describe("logger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it("stops writing after the first failed write instead of throwing", async () => {
    const { logger } = await import("./logger.js");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {
      throw Object.assign(new Error("write EPIPE"), { code: "EPIPE" });
    });
    expect(() => logger.error("first")).not.toThrow();
    expect(() => logger.error("second")).not.toThrow();
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it("writes nothing once silenced", async () => {
    const { logger, silenceLogger } = await import("./logger.js");
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    logger.info("before");
    silenceLogger();
    logger.info("after");
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
