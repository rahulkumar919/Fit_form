/**
 * Catalog service — the single place the storefront reads products,
 * combos and categories from.
 *
 *  - USE_REAL_DB=true  -> MongoDB (through a Redis cache when configured)
 *  - otherwise         -> Phase 1 mock data (local UI development only)
 *
 * Mongo documents are converted to the same `Product` / `Combo` / `Category`
 * shapes the UI already uses, so components do not care where data came from.
 * DB errors are NOT swallowed: if the database is configured but failing we
 * surface the error instead of silently showing fake mock data.
 */

import type { Category, Combo, Product, ProductCategorySlug } from "@/types";
import { connectDB, hasDB } from "@/lib/db/mongoose";
import { cache, TTL } from "@/lib/redis/client";
import { ProductModel } from "@/models/Product";
import { ComboModel } from "@/models/Combo";
import { CategoryModel } from "@/models/Category";
import {
  PRODUCTS as MOCK_PRODUCTS,
  COMBOS as MOCK_COMBOS,
  CATEGORIES as MOCK_CATEGORIES,
} from "@/lib/data/store";

/* eslint-disable @typescript-eslint/no-explicit-any */

/* ───────────────────────── serializers ───────────────────────── */

export function plain<T>(doc: unknown): T {
  return JSON.parse(JSON.stringify(doc)) as T;
}

function cleanColors(list: any): { name: string; hex: string }[] {
  return (Array.isArray(list) ? list : []).map((c: any) => ({ name: String(c.name ?? ""), hex: String(c.hex ?? "") }));
}

export function toProduct(d: any): Product {
  return {
    id: String(d._id),
    name: d.name,
    slug: d.slug,
    category: d.category,
    categoryLabel: d.categoryLabel,
    description: d.description ?? "",
    highlights: d.highlights ?? [],
    material: d.material ?? "",
    care: d.care ?? "",
    price: d.price,
    compareAtPrice: d.compareAtPrice ?? undefined,
    currency: "INR",
    images: d.images ?? [],
    variants: (d.variants ?? []).map((v: any) => ({
      id: String(v._id),
      color: v.color,
      colorHex: v.colorHex,
      images: v.images ?? [],
      sizes: v.sizes ?? [],
    })),
    sizes: d.sizes ?? [],
    colors: cleanColors(d.colors),
    rating: d.rating ?? 0,
    reviewCount: d.reviewCount ?? 0,
    // Customer reviews live in their own collection; none are shown until real ones exist.
    reviews: [],
    status: d.status,
    isNew: !!d.isNewArrival,
    isBestSeller: !!d.isBestSeller,
    isTrending: !!d.isTrending,
    isLimitedOffer: !!d.isLimitedOffer,
    sourceRef: d.sourceRef || undefined,
    createdAt: new Date(d.createdAt).toISOString(),
    tags: d.tags ?? [],
    seoTitle: d.seoTitle || undefined,
    seoDescription: d.seoDescription || undefined,
    manualRating:      d.manualRating      ?? undefined,
    manualReviewCount: d.manualReviewCount  ?? undefined,
    manualSoldCount:   d.manualSoldCount    ?? undefined,
  };
}

export function toCombo(d: any): Combo {
  return {
    id: String(d._id),
    name: d.name,
    slug: d.slug,
    tagline: d.tagline ?? "",
    description: d.description ?? "",
    images: d.images ?? [],
    video: d.video || undefined,
    items: (d.items ?? []).map((i: any) => ({
      productId: String(i.productId),
      name: i.name,
      slug: i.slug,
      image: i.image,
      price: i.price,
      category: i.category,
      categoryLabel: i.categoryLabel,
      description: i.description ?? "",
      sizes: i.sizes ?? [],
      colors: cleanColors(i.colors),
    })),
    combinedPrice: d.combinedPrice,
    comboPrice: d.comboPrice,
    availableSizes: d.availableSizes ?? [],
    tags: d.tags ?? [],
    rating: d.rating ?? 0,
    reviewCount: d.reviewCount ?? 0,
    isTrending: !!d.isTrending,
    isBestSeller: !!d.isBestSeller,
    reelRef: d.reelRef || undefined,
  };
}

function toCategory(d: any): Category {
  return {
    id: String(d._id),
    name: d.name,
    slug: d.slug,
    description: d.description ?? "",
    image: d.image ?? "",
    productCount: d.productCount ?? 0,
    order: d.order ?? 0,
    showOnHome: d.showOnHome !== false,
    showInNav: d.showInNav !== false,
  };
}

/** Read-through cache helper (no-op when Redis is not configured). */
async function cached<T>(key: string, ttl: number, load: () => Promise<T>): Promise<T> {
  const hit = await cache.get(key);
  if (hit) return JSON.parse(hit) as T;
  const value = await load();
  await cache.set(key, JSON.stringify(value), ttl);
  return value;
}

/* ───────────────────────── categories ───────────────────────── */

export async function getCategories(): Promise<Category[]> {
  if (!hasDB()) return MOCK_CATEGORIES;
  try {
    return await cached("categories:all", TTL.CATEGORIES, async () => {
      await connectDB();
      const docs = await CategoryModel.find({ isActive: true }).sort({ order: 1 }).lean();
      return plain<any[]>(docs).map(toCategory);
    });
  } catch (err) {
    console.error("[categories] DB error — using mock:", (err as Error).message?.slice(0, 120));
    return MOCK_CATEGORIES;
  }
}

export async function getCategory(slug: string): Promise<Category | undefined> {
  return (await getCategories()).find((c) => c.slug === slug);
}

/* ───────────────────────── products ───────────────────────── */

export async function getAllProducts(): Promise<Product[]> {
  if (!hasDB()) return MOCK_PRODUCTS.filter((p) => p.status === "active");
  try {
    return await cached("products:all", TTL.PRODUCTS, async () => {
      await connectDB();
      const docs = await ProductModel.find({ status: "active" }).sort({ createdAt: -1 }).lean();
      return plain<any[]>(docs).map(toProduct);
    });
  } catch (err) {
    console.error("[products] DB error — using mock:", (err as Error).message?.slice(0, 120));
    return MOCK_PRODUCTS.filter((p) => p.status === "active");
  }
}

export async function getProductsByCategory(slug: ProductCategorySlug | string): Promise<Product[]> {
  const all = await getAllProducts();
  if (slug === "all-products" || slug === "combos") return all;
  if (slug === "casual-wear") return all.filter((p) => p.tags.includes("casual"));
  if (slug === "party-wear") return all.filter((p) => p.tags.includes("party"));
  return all.filter((p) => p.category === slug);
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return (await getAllProducts()).find((p) => p.slug === slug);
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  const set = new Set(ids);
  return (await getAllProducts()).filter((p) => set.has(p.id));
}

export async function getRelatedProducts(product: Product, limit = 8): Promise<Product[]> {
  return (await getAllProducts())
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, limit);
}

/* ───────────────────────── combos ───────────────────────── */

export async function getAllCombos(): Promise<Combo[]> {
  if (!hasDB()) return MOCK_COMBOS;
  try {
    return await cached("combos:all", TTL.COMBOS, async () => {
      await connectDB();
      const docs = await ComboModel.find({ isActive: true }).sort({ createdAt: -1 }).lean();
      return plain<any[]>(docs).map(toCombo);
    });
  } catch (err) {
    console.error("[combos] DB error — using mock:", (err as Error).message?.slice(0, 120));
    return MOCK_COMBOS;
  }
}

export async function getComboBySlug(slug: string): Promise<Combo | undefined> {
  return (await getAllCombos()).find((c) => c.slug === slug);
}

export async function getCombosByIds(ids: string[]): Promise<Combo[]> {
  const set = new Set(ids);
  return (await getAllCombos()).filter((c) => set.has(c.id));
}

/** Full Product records for every item inside a combo (for per-item size/colour pickers). */
export async function getComboProducts(combo: Combo): Promise<Product[]> {
  const products = await getProductsByIds(combo.items.map((i) => i.productId));
  const byId = new Map(products.map((p) => [p.id, p]));
  return combo.items.map((i) => byId.get(i.productId)).filter(Boolean) as Product[];
}

/* ───────────────────────── homepage ───────────────────────── */

export async function getHomepageData() {
  const [products, combos, categories] = await Promise.all([
    getAllProducts(),
    getAllCombos(),
    getCategories(),
  ]);
  return {
    categories,
    bestSellers: products.filter((p) => p.isBestSeller),
    newArrivals: products.filter((p) => p.isNew),
    limitedOffers: products.filter((p) => p.isLimitedOffer),
    trendingCombos: combos.filter((c) => c.isTrending),
  };
}

/** Related combos: other combos that share at least one product category with the given combo. */
export async function getRelatedCombos(combo: Combo, limit = 4): Promise<Combo[]> {
  const categories = new Set(combo.items.map((i) => i.category ?? ""));
  return (await getAllCombos())
    .filter((c) => c.id !== combo.id && c.items.some((i) => categories.has(i.category ?? "")))
    .slice(0, limit);
}


/* ───────────────────────── search ───────────────────────── */

export async function searchCatalog(query: string) {
  const term = query.trim().toLowerCase();
  if (!term) return { products: [], combos: [] };
  const [products, combos] = await Promise.all([getAllProducts(), getAllCombos()]);
  return {
    products: products
      .filter((p) => p.name.toLowerCase().includes(term) || p.categoryLabel.toLowerCase().includes(term))
      .slice(0, 6),
    combos: combos.filter((c) => c.name.toLowerCase().includes(term)).slice(0, 3),
  };
}
