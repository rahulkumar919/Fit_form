import { describe, expect, it } from "vitest";
import {
  bannerInputSchema, categoryInputSchema, homepageSettingsSchema, internalHrefSchema,
} from "@/lib/validations/homepage";
import { DEFAULT_HOMEPAGE, createSection, mergeHomepage, selectHomeCategories } from "@/lib/homepage";
import type { CategoriesSection } from "@/lib/validations/homepage";
import type { Category } from "@/types";

const IMG = "/media/2026/11/0123456789abcdef-large.webp";
const banner = {
  title: "Denim week", subtitle: "", eyebrow: "", image: IMG, mobileImage: "", alt: "",
  ctaLabel: "Shop jeans", ctaHref: "/shop/jeans", highlights: [], theme: "dark", overlay: true,
  isActive: true, startsAt: null, endsAt: null,
};

describe("internalHrefSchema", () => {
  it.each(["/combos", "/shop/jeans", "/product/oxford-shirt?color=blue", "/l/abc123", ""])("accepts %s", (v) => {
    expect(internalHrefSchema.safeParse(v).success).toBe(true);
  });
  it.each(["https://evil.example", "//evil.example", "javascript:alert(1)", "/admin", "/admin/products", "/api/orders", "shop/jeans"])(
    "rejects %s",
    (v) => expect(internalHrefSchema.safeParse(v).success).toBe(false),
  );
});

describe("bannerInputSchema", () => {
  it("accepts a valid banner", () => {
    expect(bannerInputSchema.safeParse(banner).success).toBe(true);
  });
  it("requires an allowed image host", () => {
    expect(bannerInputSchema.safeParse({ ...banner, image: "https://example.com/a.jpg" }).success).toBe(false);
  });
  it("requires a link when a button label is set", () => {
    expect(bannerInputSchema.safeParse({ ...banner, ctaHref: "" }).success).toBe(false);
  });
  it("rejects an end date before the start", () => {
    const r = bannerInputSchema.safeParse({ ...banner, startsAt: "2026-12-10T10:00:00Z", endsAt: "2026-12-01T10:00:00Z" });
    expect(r.success).toBe(false);
  });
  it("caps highlights at 3", () => {
    expect(bannerInputSchema.safeParse({ ...banner, highlights: ["a", "b", "c", "d"] }).success).toBe(false);
  });
});

describe("homepage settings", () => {
  it("defaults are valid", () => {
    expect(homepageSettingsSchema.safeParse(DEFAULT_HOMEPAGE).success).toBe(true);
  });
  it("only allows the offered counts and per-row values", () => {
    const cats = createSection("categories") as CategoriesSection;
    expect(homepageSettingsSchema.safeParse({ ...DEFAULT_HOMEPAGE, sections: [{ ...cats, count: 7 }] }).success).toBe(false);
    expect(homepageSettingsSchema.safeParse({ ...DEFAULT_HOMEPAGE, sections: [{ ...cats, perRow: 3 }] }).success).toBe(false);
  });
  it("migrates the old fixed layout into sections without losing settings", () => {
    const m = mergeHomepage({ categories: { count: 4, style: "circle" }, banner: { height: "tall" } });
    const cats = m.sections.find((x) => x.type === "categories") as CategoriesSection;
    expect(cats.count).toBe(4);
    expect(cats.style).toBe("circle");
    expect(m.sections[0]).toMatchObject({ type: "hero", height: "tall" });
    expect(m.footer).toEqual(DEFAULT_HOMEPAGE.footer);
  });
  it("drops invalid stored sections instead of crashing", () => {
    const m = mergeHomepage({ sections: [{ type: "hero", id: "hero0001", height: "giant" }, { type: "nope", id: "x1234" }, { type: "reviews", id: "revw0001" }] });
    expect(m.sections.map((x) => x.type)).toEqual(["reviews"]);
  });
  it("rejects duplicate section ids", () => {
    const a = createSection("reviews", "same0001");
    expect(homepageSettingsSchema.safeParse({ ...DEFAULT_HOMEPAGE, sections: [a, { ...a }] }).success).toBe(false);
  });
});
describe("selectHomeCategories", () => {
  const cat = (slug: string, order: number, showOnHome?: boolean): Category => ({
    id: slug, name: slug, slug, description: "", image: "", productCount: 1, order, showOnHome,
  });
  it("keeps homepage-flagged categories in admin order and caps the count", () => {
    const list = [cat("c", 3), cat("a", 1), cat("hidden", 0, false), cat("b", 2), cat("d", 4)];
    expect(selectHomeCategories(list, 3).map((c) => c.slug)).toEqual(["a", "b", "c"]);
  });
});

describe("categoryInputSchema", () => {
  it("normalises and validates slugs", () => {
    const base = { name: "Kurtas", description: "", image: "", isActive: true, showOnHome: true, showInNav: true };
    expect(categoryInputSchema.safeParse({ ...base, slug: "Kurtas" }).success).toBe(true);
    expect(categoryInputSchema.safeParse({ ...base, slug: "kurta sets" }).success).toBe(false);
    expect(categoryInputSchema.safeParse({ ...base, slug: "../admin" }).success).toBe(false);
  });
});
