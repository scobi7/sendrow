import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const hdrs = vi.hoisted(() => ({ current: new Headers() }));
vi.mock("next/headers", () => ({ headers: async () => hdrs.current }));

import { checkRateLimit, clientIp } from "@/lib/ratelimit";

describe("checkRateLimit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests up to the limit, then blocks the next one", () => {
    const key = "limit-test";
    for (let i = 0; i < 3; i++) expect(checkRateLimit(key, 3, 60_000)).toBe(true);
    expect(checkRateLimit(key, 3, 60_000)).toBe(false);
    expect(checkRateLimit(key, 3, 60_000)).toBe(false);
  });

  it("resets the counter after the window passes", () => {
    const key = "window-test";
    expect(checkRateLimit(key, 2, 60_000)).toBe(true);
    expect(checkRateLimit(key, 2, 60_000)).toBe(true);
    expect(checkRateLimit(key, 2, 60_000)).toBe(false);

    vi.advanceTimersByTime(60_000 + 1);

    expect(checkRateLimit(key, 2, 60_000)).toBe(true);
    expect(checkRateLimit(key, 2, 60_000)).toBe(true);
    expect(checkRateLimit(key, 2, 60_000)).toBe(false);
  });

  it("keeps separate counters per key", () => {
    expect(checkRateLimit("key-a", 1, 60_000)).toBe(true);
    expect(checkRateLimit("key-a", 1, 60_000)).toBe(false);
    expect(checkRateLimit("key-b", 1, 60_000)).toBe(true);
  });
});

describe("clientIp", () => {
  it("reads the first x-forwarded-for hop, trimmed", async () => {
    hdrs.current = new Headers({ "x-forwarded-for": " 203.0.113.7 , 10.0.0.1" });
    expect(await clientIp()).toBe("203.0.113.7");
  });

  it("returns 'unknown' when the header is absent", async () => {
    hdrs.current = new Headers();
    expect(await clientIp()).toBe("unknown");
  });
});
