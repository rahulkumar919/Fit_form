import { z } from "zod";

export const supplierProductSchema = z.object({
  productId: z.string().min(1, "Select a product to link"),
  productName: z.string().min(1),
  meeshoUrl: z.string().url("Enter a valid Meesho URL"),
  meeshoRef: z.string().default(""),
  supplier: z.string().default(""),
  sourcePrice: z.number().min(0, "Source price must be >= 0"),
  sellingPrice: z.number().positive(),
  handlingCost: z.number().min(0).default(40),
  deliveryCost: z.number().min(0).default(60),
  otherCost: z.number().min(0).default(20),
  available: z.boolean().default(true),
  notes: z.string().default(""),
  status: z.enum(["linked", "unlinked", "price_changed", "out_of_stock"]).default("linked"),
});

export type SupplierProductInput = z.infer<typeof supplierProductSchema>;

export const updateSupplierProductSchema = supplierProductSchema.partial();

export const sourcePriceCheckSchema = z.object({
  supplierProductId: z.string().regex(/^[a-f0-9]{24}$/i),
  newSourcePrice: z.number().min(0).max(1_000_000),
  available: z.boolean().default(true),
  note: z.string().trim().max(120).default("Manual price check"),
});
