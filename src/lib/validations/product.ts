import { z } from "zod";
import { IMAGE_URL_MESSAGE, isAllowedImageUrl, SLUG_RE } from "@/lib/catalog-constants";

export const imageUrlSchema = z.string().trim().refine(isAllowedImageUrl, IMAGE_URL_MESSAGE);

const sizeSchema = z.object({
  size: z.string().trim().min(1, "Size is required").max(12),
  available: z.number({ error: "Units must be a number" }).int().min(0).max(100000),
});

const variantSchema = z.object({
  color: z.string().trim().min(1, "Colour name is required").max(40),
  colorHex: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pick a valid colour"),
  images: z.array(imageUrlSchema).max(10),
  sizes: z.array(sizeSchema).min(1, "Add at least one size").max(20),
});

/** Meesho sourcing link. Meesho is a reseller source; we never scrape or automate it. */
export const sourceSchema = z.object({
  meeshoUrl: z
    .string()
    .trim()
    .url("Enter a valid URL")
    .refine((v) => /(^|\.)meesho\.com$/i.test(new URL(v).hostname), "URL must be on meesho.com"),
  meeshoRef: z.string().trim().max(80),
  supplier: z.string().trim().max(80),
  sourcePrice: z.number({ error: "Source price must be a number" }).min(0).max(1_000_000),
  handlingCost: z.number().min(0).max(100000),
  deliveryCost: z.number().min(0).max(100000),
  otherCost: z.number().min(0).max(100000),
  notes: z.string().trim().max(500),
});

export const productInputSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
    slug: z
      .string()
      .trim()
      .min(2)
      .max(100)
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug: lowercase letters, numbers and single hyphens"),
    // Checked against the categories collection in the API (see resolveProductCategory).
    category: z.string().trim().min(2, "Choose a category").max(40).regex(SLUG_RE, "Choose a category"),
    description: z.string().trim().min(10, "Description must be at least 10 characters").max(5000),
    highlights: z.array(z.string().trim().min(1).max(160)).max(12),
    material: z.string().trim().max(200),
    care: z.string().trim().max(300),
    price: z.number({ error: "Selling price must be a number" }).int("Use whole rupees").min(1).max(1_000_000),
    compareAtPrice: z.number().int().min(1).max(1_000_000).nullable(),
    images: z.array(imageUrlSchema).max(12),
    variants: z.array(variantSchema).max(12),
    status: z.enum(["active", "draft", "archived"]),
    isNewArrival: z.boolean(),
    isBestSeller: z.boolean(),
    isTrending: z.boolean(),
    isLimitedOffer: z.boolean(),
    tags: z.array(z.string().trim().toLowerCase().min(1).max(30)).max(15),
    seoTitle: z.string().trim().max(70),
    seoDescription: z.string().trim().max(170),
    source: sourceSchema.nullable(),
    /** Admin social-proof overrides — shown when real data is 0 */
    manualRating:      z.number().min(0).max(5).optional().nullable(),
    manualReviewCount: z.number().int().min(0).max(100000).optional().nullable(),
    manualSoldCount:   z.number().int().min(0).max(10000000).optional().nullable(),
  })
  .superRefine((v, ctx) => {
    if (v.compareAtPrice !== null && v.compareAtPrice <= v.price) {
      ctx.addIssue({ code: "custom", path: ["compareAtPrice"], message: "Compare-at price must be higher than the selling price" });
    }
    const colors = new Set<string>();
    v.variants.forEach((variant, i) => {
      const key = variant.color.toLowerCase();
      if (colors.has(key)) ctx.addIssue({ code: "custom", path: ["variants", i, "color"], message: `Duplicate colour "${variant.color}"` });
      colors.add(key);
      const sizes = new Set<string>();
      variant.sizes.forEach((s, j) => {
        const sk = s.size.toLowerCase();
        if (sizes.has(sk)) ctx.addIssue({ code: "custom", path: ["variants", i, "sizes", j, "size"], message: `Duplicate size "${s.size}"` });
        sizes.add(sk);
      });
    });
    if (v.status === "active") {
      if (v.images.length < 1) ctx.addIssue({ code: "custom", path: ["images"], message: "An active product needs at least one image" });
      if (v.variants.length < 1) ctx.addIssue({ code: "custom", path: ["variants"], message: "An active product needs at least one colour/size" });
    }
  });

export type ProductInput = z.infer<typeof productInputSchema>;
export type SourceInput = z.infer<typeof sourceSchema>;
