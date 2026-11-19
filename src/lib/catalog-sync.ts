/**
 * Server-side catalog write helpers shared by the admin product/combo APIs.
 *
 * Keeps denormalised data consistent:
 *  - product.sizes / product.colors / inStock flags are DERIVED from variants
 *  - combos embed a snapshot of their products; it is rebuilt when a product changes
 *  - category product counts are recomputed
 *  - Redis + Next page caches are invalidated so edits show up immediately
 */

import { revalidatePath } from "next/cache";
import type { Types } from "mongoose";
import { cache } from "@/lib/redis/client";
import { categoryLabel, isSystemCategory } from "@/lib/catalog-constants";
import type { ProductInput, SourceInput } from "@/lib/validations/product";
import { ProductModel } from "@/models/Product";
import { ComboModel } from "@/models/Combo";
import { CategoryModel } from "@/models/Category";
import { SupplierProductModel } from "@/models/SupplierProduct";
import { SourcePriceHistoryModel } from "@/models/SourcePriceHistory";

/* eslint-disable @typescript-eslint/no-explicit-any */

/* ───────────── product document ───────────── */

/**
 * Categories a product can be filed under: every non-system category in the DB
 * (inactive ones included, so a hidden category doesn't break existing products).
 */
export async function getAssignableCategories(): Promise<{ slug: string; label: string; isActive: boolean }[]> {
  const docs = await CategoryModel.find().sort({ order: 1 }).select("name slug isActive").lean();
  return docs
    .filter((c: any) => !isSystemCategory(c.slug))
    .map((c: any) => ({ slug: c.slug, label: c.name, isActive: c.isActive !== false }));
}

/** Display label for an assignable category slug, or null if it can't hold products. */
export async function resolveProductCategory(slug: string): Promise<string | null> {
  if (isSystemCategory(slug)) return null;
  const c: any = await CategoryModel.findOne({ slug }).select("name").lean();
  return c?.name ?? null;
}

export function buildProductDoc(input: ProductInput, label?: string) {
  const variants = input.variants.map((v) => ({
    color: v.color,
    colorHex: v.colorHex.toLowerCase(),
    images: v.images,
    sizes: v.sizes.map((s) => ({ size: s.size, available: s.available, inStock: s.available > 0 })),
  }));

  // Flat lists used by filters and cards, derived (never trusted from the client).
  const sizes: string[] = [];
  for (const v of variants) for (const s of v.sizes) if (!sizes.includes(s.size)) sizes.push(s.size);
  const colors = variants.map((v) => ({ name: v.color, hex: v.colorHex }));

  return {
    name: input.name,
    slug: input.slug,
    category: input.category,
    categoryLabel: label ?? categoryLabel(input.category),
    description: input.description,
    highlights: input.highlights,
    material: input.material,
    care: input.care,
    price: input.price,
    compareAtPrice: input.compareAtPrice ?? undefined,
    currency: "INR" as const,
    images: input.images,
    variants,
    sizes,
    colors,
    status: input.status,
    isNewArrival: input.isNewArrival,
    isBestSeller: input.isBestSeller,
    isTrending: input.isTrending,
    isLimitedOffer: input.isLimitedOffer,
    sourceRef: input.source?.meeshoRef || undefined,
    tags: input.tags,
    seoTitle: input.seoTitle || undefined,
    seoDescription: input.seoDescription || undefined,
    manualRating:      input.manualRating      ?? undefined,
    manualReviewCount: input.manualReviewCount  ?? undefined,
    manualSoldCount:   input.manualSoldCount    ?? undefined,
  };
}

/* ───────────── Meesho source mapping ───────────── */

export function estimateProfit(sellingPrice: number, s: Pick<SourceInput, "sourcePrice" | "handlingCost" | "deliveryCost" | "otherCost">) {
  return sellingPrice - s.sourcePrice - s.handlingCost - s.deliveryCost - s.otherCost;
}

/** Create / update / remove the single Meesho source link for a product. */
export async function applySource(productId: Types.ObjectId | string, productName: string, price: number, source: SourceInput | null) {
  const existing = await SupplierProductModel.findOne({ productId });

  if (!source) {
    if (existing) {
      await SourcePriceHistoryModel.deleteMany({ supplierProductId: existing._id });
      await existing.deleteOne();
    }
    return;
  }

  const fields = {
    productName,
    meeshoUrl: source.meeshoUrl,
    meeshoRef: source.meeshoRef,
    supplier: source.supplier,
    sourcePrice: source.sourcePrice,
    sellingPrice: price,
    handlingCost: source.handlingCost,
    deliveryCost: source.deliveryCost,
    otherCost: source.otherCost,
    estimatedProfit: estimateProfit(price, source),
    notes: source.notes,
  };

  if (!existing) {
    const created = await SupplierProductModel.create({ productId, ...fields, status: "linked", available: true });
    await SourcePriceHistoryModel.create({ supplierProductId: created._id, sourcePrice: source.sourcePrice, note: "Initial source price" });
    return;
  }

  const priceChanged = existing.sourcePrice !== source.sourcePrice;
  existing.set({ ...fields, ...(priceChanged ? { lastPriceChecked: new Date() } : {}) });
  await existing.save();
  if (priceChanged) {
    await SourcePriceHistoryModel.create({ supplierProductId: existing._id, sourcePrice: source.sourcePrice, note: "Updated from product form" });
  }
}

/* ───────────── combos ───────────── */

function itemSnapshot(p: any) {
  return {
    productId: p._id,
    name: p.name,
    slug: p.slug,
    image: p.images?.[0] ?? "",
    price: p.price,
    category: p.category,
    categoryLabel: p.categoryLabel,
    description: p.description ?? "",
    sizes: p.sizes ?? [],
    colors: p.colors ?? [],
  };
}

export function buildComboItems(products: any[]) {
  const items = products.map(itemSnapshot);
  const availableSizes: string[] = [];
  for (const it of items) for (const s of it.sizes) if (!availableSizes.includes(s)) availableSizes.push(s);
  return { items, combinedPrice: items.reduce((sum, i) => sum + i.price, 0), availableSizes };
}

/**
 * Rebuild the embedded snapshot of every combo containing this product.
 * Returns names of combos whose combo price no longer undercuts the total.
 */
export async function syncCombosForProduct(product: any): Promise<string[]> {
  const combos = await ComboModel.find({ "items.productId": product._id });
  const warnings: string[] = [];

  for (const combo of combos) {
    const items = combo.items.map((i: any) => (String(i.productId) === String(product._id) ? itemSnapshot(product) : i));
    const combinedPrice = items.reduce((sum: number, i: any) => sum + i.price, 0);
    const availableSizes: string[] = [];
    for (const it of items) for (const s of it.sizes ?? []) if (!availableSizes.includes(s)) availableSizes.push(s);

    combo.set({ items, combinedPrice, availableSizes });
    await combo.save();
    if (combo.comboPrice >= combinedPrice) warnings.push(combo.name);
  }
  return warnings;
}

/** Combos (any state) that still reference this product. */
export async function combosUsingProduct(productId: Types.ObjectId | string, onlyActive = false) {
  const query: Record<string, unknown> = { "items.productId": productId };
  if (onlyActive) query.isActive = true;
  return ComboModel.find(query).select("name slug isActive").lean();
}

/* ───────────── counts + caches ───────────── */

export async function refreshCategoryCounts() {
  const [byCategory, casual, party, total, comboCount] = await Promise.all([
    ProductModel.aggregate([{ $match: { status: "active" } }, { $group: { _id: "$category", n: { $sum: 1 } } }]),
    ProductModel.countDocuments({ status: "active", tags: "casual" }),
    ProductModel.countDocuments({ status: "active", tags: "party" }),
    ProductModel.countDocuments({ status: "active" }),
    ComboModel.countDocuments({ isActive: true }),
  ]);
  const counts = new Map<string, number>(byCategory.map((r: any) => [r._id, r.n]));
  counts.set("casual-wear", casual);
  counts.set("party-wear", party);
  counts.set("all-products", total);
  counts.set("combos", comboCount);

  const cats = await CategoryModel.find().select("slug").lean();
  await Promise.all(
    cats.map((c: any) => CategoryModel.updateOne({ _id: c._id }, { $set: { productCount: counts.get(c.slug) ?? 0 } })),
  );
}

/** Call after any product/combo write. */
export async function afterCatalogChange() {
  await refreshCategoryCounts();
  await cache.del("products:all", "combos:all", "categories:all");
  revalidatePath("/", "page");
  revalidatePath("/combos", "page");
  revalidatePath("/shop/[category]", "page");
  revalidatePath("/product/[slug]", "page");
  revalidatePath("/combo/[slug]", "page");
}
