import { describe, expect, it } from "vitest";
import { classifyLanding, deviceFromUA, isBot } from "@/lib/tracking/source";
import { decodeAttr, encodeAttr, isValidId, newId } from "@/lib/tracking/cookies";

const host = "fitandform.in";
const q = (s: string) => new URLSearchParams(s);

describe("classifyLanding", () => {
  it("credits utm_source", () => {
    expect(classifyLanding(q("utm_source=instagram&utm_campaign=diwali"), "", host)).toMatchObject({ source: "instagram", campaign: "diwali" });
    expect(classifyLanding(q("utm_source=whatsapp"), "", host)?.source).toBe("whatsapp");
  });

  it("classifies referrers", () => {
    expect(classifyLanding(q(""), "https://www.google.co.in/", host)?.source).toBe("seo");
    expect(classifyLanding(q(""), "https://l.instagram.com/?u=x", host)?.source).toBe("instagram");
    expect(classifyLanding(q(""), "https://web.whatsapp.com/", host)?.source).toBe("whatsapp");
    expect(classifyLanding(q(""), "https://some-blog.example/post", host)?.source).toBe("referral");
  });

  it("treats no referrer as direct and own site as internal navigation", () => {
    expect(classifyLanding(q(""), "", host)?.source).toBe("direct");
    expect(classifyLanding(q(""), "https://fitandform.in/combos", host)).toBeNull();
  });

  it("sanitises campaign values", () => {
    const t = classifyLanding(q("utm_source=ig&utm_campaign=<script>alert(1)</script>"), "", host);
    expect(t?.campaign).not.toMatch(/[<>()]/);
  });
});

describe("bots and devices", () => {
  it("filters link-preview crawlers but not real in-app browsers", () => {
    expect(isBot("facebookexternalhit/1.1")).toBe(true);
    expect(isBot("WhatsApp/2.23.20 A")).toBe(true);
    expect(isBot("")).toBe(true);
    expect(isBot("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Instagram 300.0")).toBe(false);
  });
  it("detects device type", () => {
    expect(deviceFromUA("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)")).toBe("mobile");
    expect(deviceFromUA("Mozilla/5.0 (iPad; CPU OS 17_0)")).toBe("tablet");
    expect(deviceFromUA("Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)")).toBe("desktop");
  });
});

describe("attribution cookie", () => {
  it("round-trips and rejects garbage", () => {
    const a = { source: "instagram_dm" as const, medium: "tracked_link", campaign: "x", linkCode: "reel-1", landingPath: "/combo/a", at: 1 };
    expect(decodeAttr(encodeAttr(a))).toEqual(a);
    expect(decodeAttr("not-base64-json")).toBeNull();
    expect(decodeAttr("x".repeat(5000))).toBeNull();
  });
  it("generates valid ids", () => {
    const id = newId();
    expect(isValidId(id)).toBe(true);
    expect(isValidId("../../etc")).toBe(false);
  });
});
