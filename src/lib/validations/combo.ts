import { z } from "zod";
import { OBJECT_ID_RE } from "@/lib/catalog-constants";
import { imageUrlSchema } from "./product";

/**
 * Combos reference products by id only. The server rebuilds names, prices,
 * sizes and the "combined" total from the database, so a client can never
 * fake the numbers shown to customers.
 */
export const comboInputSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(120),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug: lowercase letters, numbers and single hyphens"),
  tagline: z.string().trim().max(120),
  description: z.string().trim().min(10, "Description must be at least 10 characters").max(3000),
  images: z.array(imageUrlSchema).max(10),
  productIds: z
    .array(z.string().regex(OBJECT_ID_RE, "Invalid product"))
    .min(2, "A combo needs at least 2 products")
    .max(8, "A combo can have at most 8 products"),
  comboPrice: z.number({ error: "Combo price must be a number" }).int("Use whole rupees").min(1).max(1_000_000),
  tags: z.array(z.string().trim().toLowerCase().min(1).max(30)).max(15),
  isTrending: z.boolean(),
  isBestSeller: z.boolean(),
  isActive: z.boolean(),
  reelRef: z.string().trim().max(60).regex(/^[A-Za-z0-9_-]*$/, "Letters, numbers, _ and - only"),
  seoTitle: z.string().trim().max(70),
  seoDescription: z.string().trim().max(170),
}).superRefine((v, ctx) => {
  if (new Set(v.productIds).size !== v.productIds.length) {
    ctx.addIssue({ code: "custom", path: ["productIds"], message: "A product can only be added once" });
  }
});

export type ComboInput = z.infer<typeof comboInputSchema>;
