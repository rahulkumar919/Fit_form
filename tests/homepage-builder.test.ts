import { describe, expect, it } from "vitest";
import type { Product } from "@/types";
import { createSection, fillTokens, productsViewAllHref, selectProducts } from "@/lib/homepage";
import { homepageSettingsSchema, type ProductsSection, type PromoSection } from "@/lib/validations/homepage";
import { DEFAULT_HOMEPAGE } from "@/lib/homepage";
import { SECTION_TYPES } from "@/lib/validations/homepage";

const prod = (id: string, o: Partial<Product> = {}): Product => ({
  id, name: id, slug: id, category: "jeans", categoryLabel: "Jeans", description: "", highlights: [], material: "", care: "",
  price: 1000, images: [], variants: [], sizes: [], colors: [], status: "active", rating: 0, reviewCount: 0, tags: [],
  isNew: false, isBestSeller: false, isTrending: false, isLimitedOffer: false, createdAt: "2026-01-01T00:00:00Z", ...o,
} as unknown as Product);

describe("createSection", () => {
  it.each(SECTION_TYPES)("default %s section is valid (except empty promo)", (t) => {
    const s = createSection(t);
    const r = homepageSettingsSchema.safeParse({ ...DEFAULT_HOMEPAGE, sections: [s] });
    expect(r.success).toBe(t !== "promo");
  });
});

describe("selectProducts", () => {
  const all = [
    prod("a", { isBestSeller: true, price: 900 }),
    prod("b", { category: "shirts", price: 1500, compareAtPrice: 3000 }),
    prod("c", { isBestSeller: true, price: 500, compareAtPrice: 600 }),
    prod("d", { category: "shirts", tags: ["party"] }),
  ];
  const base = createSection("products") as ProductsSection;
  it("filters by source and caps count", () => {
    expect(selectProducts({ ...base, source: "bestsellers" }, all).map((p) => p.id)).toEqual(["a", "c"]);
    expect(selectProducts({ ...base, source: "category", category: "shirts" }, all).map((p) => p.id)).toEqual(["b", "d"]);
    expect(selectProducts({ ...base, source: "category", category: "party-wear" }, all).map((p) => p.id)).toEqual(["d"]);
    expect(selectProducts({ ...base, source: "all", count: 4 }, all)).toHaveLength(4);
  });
  it("keeps hand-picked order and skips missing products", () => {
    expect(selectProducts({ ...base, source: "manual", productIds: ["c", "zzz", "a"] }, all).map((p) => p.id)).toEqual(["c", "a"]);
  });
  it("sorts", () => {
    expect(selectProducts({ ...base, source: "all", sort: "price-asc" }, all)[0].id).toBe("c");
    expect(selectProducts({ ...base, source: "sale", sort: "discount" }, all).map((p) => p.id)).toEqual(["b", "c"]);
  });
  it("view-all link follows the category", () => {
    expect(productsViewAllHref({ ...base, source: "category", category: "shirts" })).toBe("/shop/shirts");
    expect(productsViewAllHref({ ...base, viewAllHref: "/combos" })).toBe("/combos");
  });
});

describe("promo section", () => {
  const promo = (o: Partial<PromoSection>) => ({ ...(createSection("promo") as PromoSection), ...o });
  const item = { image: "/media/2026/11/0123456789abcdef-large.webp", mobileImage: "", alt: "", href: "/shop/jeans", title: "", subtitle: "", ctaLabel: "", theme: "light" as const, overlay: true };
  it("accepts 1–4 images with internal links only", () => {
    expect(homepageSettingsSchema.safeParse({ ...DEFAULT_HOMEPAGE, sections: [promo({ items: [item, item] })] }).success).toBe(true);
    expect(homepageSettingsSchema.safeParse({ ...DEFAULT_HOMEPAGE, sections: [promo({ items: [item, item, item, item, item] })] }).success).toBe(false);
    expect(homepageSettingsSchema.safeParse({ ...DEFAULT_HOMEPAGE, sections: [promo({ items: [{ ...item, href: "https://evil.example" }] })] }).success).toBe(false);
  });
});

describe("footer + tokens", () => {
  it("fills {freeShipping} from live settings", () => {
    expect(fillTokens("On orders above {freeShipping}", { freeShippingThreshold: 2499 })).toBe("On orders above ₹2,499");
  });
  it("rejects external footer links", () => {
    const footer = { ...DEFAULT_HOMEPAGE.footer, columns: [{ title: "x", links: [{ label: "y", href: "https://evil.example" }] }] };
    expect(homepageSettingsSchema.safeParse({ ...DEFAULT_HOMEPAGE, footer }).success).toBe(false);
  });
  it("only accepts real facebook/youtube URLs", () => {
    expect(homepageSettingsSchema.safeParse({ ...DEFAULT_HOMEPAGE, social: { facebook: "https://evil.com/x", youtube: "" } }).success).toBe(false);
    expect(homepageSettingsSchema.safeParse({ ...DEFAULT_HOMEPAGE, social: { facebook: "https://www.facebook.com/fitandform", youtube: "https://youtube.com/@fitandform" } }).success).toBe(true);
  });
});

describe("combo card sizes + bottom nav", () => {
  const combos = createSection("combos") as import("@/lib/validations/homepage").CombosSection;
  it("combo rows allow 2–6 per row and small phone cards", () => {
    for (const perRow of [2, 3, 4, 5, 6]) {
      expect(homepageSettingsSchema.safeParse({ ...DEFAULT_HOMEPAGE, sections: [{ ...combos, perRow, mobileSize: "sm" }] }).success).toBe(true);
    }
    expect(homepageSettingsSchema.safeParse({ ...DEFAULT_HOMEPAGE, sections: [{ ...combos, perRow: 7 }] }).success).toBe(false);
  });
  it("older saved sections get a phone card size by default", async () => {
    const { mergeHomepage } = await import("@/lib/homepage");
    const m = mergeHomepage({ sections: [{ type: "combos", id: "combo001", perRow: 4 }] });
    expect(m.sections[0]).toMatchObject({ type: "combos", mobileSize: "md" });
    expect(m.bottomNav).toEqual(DEFAULT_HOMEPAGE.bottomNav);
  });
  it("bottom nav needs 3–5 unique buttons", () => {
    const ok = (items: string[]) => homepageSettingsSchema.safeParse({ ...DEFAULT_HOMEPAGE, bottomNav: { enabled: true, items } }).success;
    expect(ok(["home", "shop", "bag"])).toBe(true);
    expect(ok(["home", "shop"])).toBe(false);
    expect(ok(["home", "shop", "combos", "search", "wishlist", "bag"])).toBe(false);
    expect(ok(["home", "home", "bag"])).toBe(false);
    expect(ok(["home", "shop", "telegram"])).toBe(false);
  });
});
