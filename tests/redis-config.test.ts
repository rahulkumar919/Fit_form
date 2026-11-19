import { afterEach, describe, expect, it } from "vitest";
import { upstashConfigured } from "@/lib/redis/client";

const saved = { url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN };
const set = (url?: string, token?: string) => {
  if (url === undefined) delete process.env.UPSTASH_REDIS_REST_URL; else process.env.UPSTASH_REDIS_REST_URL = url;
  if (token === undefined) delete process.env.UPSTASH_REDIS_REST_TOKEN; else process.env.UPSTASH_REDIS_REST_TOKEN = token;
};
afterEach(() => set(saved.url, saved.token));

describe("upstashConfigured", () => {
  it("is false when unset or empty", () => {
    set(undefined, undefined);
    expect(upstashConfigured()).toBe(false);
    set("", "");
    expect(upstashConfigured()).toBe(false);
  });
  it("ignores placeholder values from .env.example", () => {
    set("https://your-upstash-url.io", "your-upstash-token");
    expect(upstashConfigured()).toBe(false);
  });
  it("rejects non-https URLs", () => {
    set("http://eu1-real-host.upstash.io", "A".repeat(40));
    expect(upstashConfigured()).toBe(false);
  });
  it("accepts real-looking credentials", () => {
    set("https://eu1-calm-fox-12345.upstash.io", "AXbCASQgNzk1YjE2ZDgtMWUxNi00YzA3LWE2ZDEt");
    expect(upstashConfigured()).toBe(true);
  });
});
