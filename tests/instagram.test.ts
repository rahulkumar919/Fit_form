import { describe, expect, it } from "vitest";
import { instagramEmbedUrl, normaliseHandle, parseInstagramUrl } from "@/lib/instagram";
import { detectVideo } from "@/lib/storage/video";
import { isAllowedVideoUrl } from "@/lib/storage/video-url";
import { homepageSettingsSchema, socialPostInputSchema } from "@/lib/validations/homepage";
import { DEFAULT_HOMEPAGE } from "@/lib/homepage";

describe("parseInstagramUrl", () => {
  it.each([
    ["https://www.instagram.com/reel/C9xYz12AbCd/", "reel", "https://www.instagram.com/reel/C9xYz12AbCd/"],
    ["https://instagram.com/reels/C9xYz12AbCd?igsh=abc", "reel", "https://www.instagram.com/reel/C9xYz12AbCd/"],
    ["https://www.instagram.com/fitandform/reel/C9xYz12AbCd/", "reel", "https://www.instagram.com/reel/C9xYz12AbCd/"],
    ["https://www.instagram.com/p/C1abcDEF234/?img_index=1", "post", "https://www.instagram.com/p/C1abcDEF234/"],
  ])("parses %s", (raw, kind, url) => {
    expect(parseInstagramUrl(raw)).toMatchObject({ kind, url });
  });

  it.each([
    "http://www.instagram.com/reel/C9xYz12AbCd/",
    "https://www.instagram.com/fitandform/",
    "https://evil.com/reel/C9xYz12AbCd/",
    "https://instagram.com.evil.com/reel/C9xYz12AbCd/",
    "javascript:alert(1)",
    "not a url",
  ])("rejects %s", (raw) => expect(parseInstagramUrl(raw)).toBeNull());

  it("builds the official embed URL", () => {
    expect(instagramEmbedUrl("https://www.instagram.com/reel/C9xYz12AbCd/")).toBe("https://www.instagram.com/reel/C9xYz12AbCd/embed/");
  });
});

describe("normaliseHandle", () => {
  it.each([["@fit.and_form", "fit.and_form"], ["https://www.instagram.com/fitandform/", "fitandform"], ["fitandform", "fitandform"], ["bad handle!", ""]])(
    "%s → %s",
    (raw, out) => expect(normaliseHandle(raw)).toBe(out),
  );
});

describe("detectVideo", () => {
  it("detects MP4 by ftyp box", () => {
    expect(detectVideo(Buffer.from([0, 0, 0, 0x18, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d]))).toBe("mp4");
  });
  it("detects WebM by EBML header", () => {
    expect(detectVideo(Buffer.from([0x1a, 0x45, 0xdf, 0xa3, 0, 0, 0, 0, 0, 0, 0, 0]))).toBe("webm");
  });
  it("rejects other files", () => {
    expect(detectVideo(Buffer.from("<html><script>alert(1)</script></html>"))).toBeNull();
    expect(detectVideo(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0, 0, 0, 0, 0, 0, 0, 0]))).toBeNull();
  });
});

describe("isAllowedVideoUrl", () => {
  it("allows only our storage URLs", () => {
    expect(isAllowedVideoUrl("/media/videos/2026/11/0123456789abcdef.mp4")).toBe(true);
    expect(isAllowedVideoUrl("https://res.cloudinary.com/demo/video/upload/v1/fitandform/reels/0123456789abcdef.mp4")).toBe(true);
    expect(isAllowedVideoUrl("/media/videos/../../.env.local")).toBe(false);
    expect(isAllowedVideoUrl("https://evil.com/x.mp4")).toBe(false);
  });
});

describe("socialPostInputSchema", () => {
  const base = {
    instagramUrl: "https://instagram.com/reels/C9xYz12AbCd/", image: "/media/2026/11/0123456789abcdef-large.webp", video: "",
    caption: "Denim, 3 ways", linkType: "none", linkId: "", showInReels: true, showInGallery: true, isActive: true,
  };
  it("normalises the URL and kind", () => {
    const r = socialPostInputSchema.safeParse(base);
    expect(r.success && r.data).toMatchObject({ instagramUrl: "https://www.instagram.com/reel/C9xYz12AbCd/", kind: "reel", linkId: null });
  });
  it("needs a target when a shop link type is chosen", () => {
    expect(socialPostInputSchema.safeParse({ ...base, linkType: "combo" }).success).toBe(false);
  });
  it("rejects foreign video URLs", () => {
    expect(socialPostInputSchema.safeParse({ ...base, video: "https://evil.com/a.mp4" }).success).toBe(false);
  });
  it("must appear in at least one section", () => {
    expect(socialPostInputSchema.safeParse({ ...base, showInReels: false, showInGallery: false }).success).toBe(false);
  });
});

describe("homepage settings (sections)", () => {
  it("normalises the Instagram handle", () => {
    const r = homepageSettingsSchema.safeParse({ ...DEFAULT_HOMEPAGE, instagramHandle: "@fitandform" });
    expect(r.success && r.data.instagramHandle).toBe("fitandform");
  });
  it("Instagram button needs a username", () => {
    expect(homepageSettingsSchema.safeParse({ ...DEFAULT_HOMEPAGE, floating: { ...DEFAULT_HOMEPAGE.floating, instagram: true } }).success).toBe(false);
  });
});
