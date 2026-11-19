import { describe, expect, it } from "vitest";
import { productInputSchema } from "@/lib/validations/product";
import { comboInputSchema } from "@/lib/validations/combo";
import { linkInputSchema } from "@/lib/validations/link";
import { safeRedirectPath } from "@/lib/auth/redirect";
import { isAllowedImageUrl } from "@/lib/catalog-constants";
import { displayName } from "@/services/reviews";

const IMG = "https://images.unsplash.com/photo-1?w=700";
const baseProduct = {
  name: "Slim Jeans", slug: "slim-jeans", category: "jeans", description: "A good pair of slim jeans.",
  highlights: [], material: "", care: "", price: 1000, compareAtPrice: null, images: [IMG],
  variants: [{ color: "Blue", colorHex: "#1d4ed8", images: [], sizes: [{ size: "32", available: 3 }] }],
  status: "active", isNewArrival: false, isBestSeller: false, isTrending: false, isLimitedOffer: false,
  tags: [], seoTitle: "", seoDescription: "", source: null,
};

describe("productInputSchema", () => {
  it("accepts a valid product", () => {
    expect(productInputSchema.safeParse(baseProduct).success).toBe(true);
  });
  it("rejects compare-at not above price", () => {
    expect(productInputSchema.safeParse({ ...baseProduct, compareAtPrice: 900 }).success).toBe(false);
  });
  it("rejects images from unknown hosts", () => {
    expect(productInputSchema.safeParse({ ...baseProduct, images: ["https://evil.example/x.jpg"] }).success).toBe(false);
  });
  it("rejects duplicate sizes and colours", () => {
    const dupSize = { ...baseProduct, variants: [{ ...baseProduct.variants[0], sizes: [{ size: "M", available: 1 }, { size: "m", available: 1 }] }] };
    const dupColor = { ...baseProduct, variants: [baseProduct.variants[0], { ...baseProduct.variants[0] }] };
    expect(productInputSchema.safeParse(dupSize).success).toBe(false);
    expect(productInputSchema.safeParse(dupColor).success).toBe(false);
  });
  it("requires images and variants only when active", () => {
    expect(productInputSchema.safeParse({ ...baseProduct, images: [], variants: [] }).success).toBe(false);
    expect(productInputSchema.safeParse({ ...baseProduct, status: "draft", images: [], variants: [] }).success).toBe(true);
  });
  it("only accepts meesho.com source links", () => {
    const src = { meeshoUrl: "https://www.meesho.com/p/1", meeshoRef: "", supplier: "", sourcePrice: 500, handlingCost: 0, deliveryCost: 0, otherCost: 0, notes: "" };
    expect(productInputSchema.safeParse({ ...baseProduct, source: src }).success).toBe(true);
    expect(productInputSchema.safeParse({ ...baseProduct, source: { ...src, meeshoUrl: "https://meesho.com.evil.io/p" } }).success).toBe(false);
  });
});

describe("comboInputSchema", () => {
  const combo = {
    name: "Combo", slug: "combo", tagline: "", description: "Two pieces that go together.", images: [],
    productIds: ["a".repeat(24), "b".repeat(24)], comboPrice: 1500, tags: [], isTrending: false, isBestSeller: false,
    isActive: true, reelRef: "", seoTitle: "", seoDescription: "",
  };
  it("needs at least two distinct products", () => {
    expect(comboInputSchema.safeParse(combo).success).toBe(true);
    expect(comboInputSchema.safeParse({ ...combo, productIds: ["a".repeat(24)] }).success).toBe(false);
    expect(comboInputSchema.safeParse({ ...combo, productIds: ["a".repeat(24), "a".repeat(24)] }).success).toBe(false);
  });
});

describe("tracked link destinations", () => {
  const link = { code: "reel-1", name: "Reel", channel: "instagram_reel", campaign: "", destination: "/combos", isActive: true };
  it("allows on-site paths only", () => {
    expect(linkInputSchema.safeParse(link).success).toBe(true);
    for (const destination of ["https://evil.example", "//evil.example", "/admin/orders", "/api/x", "/l/other"]) {
      expect(linkInputSchema.safeParse({ ...link, destination }).success).toBe(false);
    }
  });
});

describe("safeRedirectPath (open-redirect protection)", () => {
  it("keeps same-origin paths and rejects everything else", () => {
    expect(safeRedirectPath("/checkout", "/")).toBe("/checkout");
    expect(safeRedirectPath("https://fitandform.in/orders", "/", "https://fitandform.in")).toBe("/orders");
    expect(safeRedirectPath("https://evil.example/x", "/", "https://fitandform.in")).toBe("/");
    expect(safeRedirectPath("//evil.example", "/")).toBe("/");
    expect(safeRedirectPath("/login", "/account")).toBe("/account");
  });
});

describe("image URLs", () => {
  it("accepts uploads and allowed CDNs only", () => {
    expect(isAllowedImageUrl("/media/2026/11/0123456789abcdef-large.webp")).toBe(true);
    expect(isAllowedImageUrl("/media/../../etc/passwd")).toBe(false);
    expect(isAllowedImageUrl("http://images.unsplash.com/x")).toBe(false);
    expect(isAllowedImageUrl("https://res.cloudinary.com/demo/x.webp")).toBe(true);
  });
});

describe("review author names", () => {
  it("never exposes full names", () => {
    expect(displayName("Riya Sharma")).toBe("Riya S.");
    expect(displayName("Arjun")).toBe("Arjun");
    expect(displayName("")).toBe("Verified buyer");
  });
});
