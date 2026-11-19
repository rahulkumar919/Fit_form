/** Shared (client + server safe) catalog constants and small helpers. */

export const PRODUCT_CATEGORIES = [
  { slug: "jeans", label: "Jeans" },
  { slug: "shirts", label: "Shirts" },
  { slug: "t-shirts", label: "T-Shirts" },
  { slug: "shoes", label: "Shoes" },
  { slug: "sneakers", label: "Sneakers" },
  { slug: "accessories", label: "Accessories" },
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number]["slug"];

export const CATEGORY_SLUGS = PRODUCT_CATEGORIES.map((c) => c.slug) as [ProductCategory, ...ProductCategory[]];

/**
 * Built-in collections that aren't assigned to products directly: they are computed
 * (all products, combos, or by tag). Admins can rename/re-image them but not delete them
 * or change their slug.
 */
export const SYSTEM_CATEGORY_SLUGS = ["all-products", "combos", "casual-wear", "party-wear"] as const;
export function isSystemCategory(slug: string): boolean {
  return (SYSTEM_CATEGORY_SLUGS as readonly string[]).includes(slug);
}
/** URL for a category tile / nav link. */
export function categoryHref(slug: string): string {
  return slug === "combos" ? "/combos" : `/shop/${slug}`;
}
export const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function categoryLabel(slug: string): string {
  return PRODUCT_CATEGORIES.find((c) => c.slug === slug)?.label ?? slug;
}

/**
 * Hosts next/image is configured for (see next.config.ts). Any image URL
 * saved by the admin must be on this list or the storefront page would crash.
 * Phase 5 (image storage) will produce Cloudinary / server-storage URLs.
 */
export const ALLOWED_IMAGE_HOSTS = ["images.unsplash.com", "plus.unsplash.com", "res.cloudinary.com"] as const;

export function isAllowedImageUrl(value: string): boolean {
  if (/^\/media\/\d{4}\/\d{2}\/[a-f0-9]{16}-(large|medium|thumb)\.webp$/.test(value)) return true;
  try {
    const u = new URL(value);
    return u.protocol === "https:" && (ALLOWED_IMAGE_HOSTS as readonly string[]).includes(u.hostname);
  } catch {
    return false;
  }
}

export const IMAGE_URL_MESSAGE =
  "Upload the image, or use an https URL from images.unsplash.com, plus.unsplash.com or res.cloudinary.com";

export const SIZE_PRESETS: { label: string; sizes: string[] }[] = [
  { label: "Apparel S–XXL", sizes: ["S", "M", "L", "XL", "XXL"] },
  { label: "Jeans 28–36", sizes: ["28", "30", "32", "34", "36"] },
  { label: "Shoes 6–11", sizes: ["6", "7", "8", "9", "10", "11"] },
  { label: "One size", sizes: ["One Size"] },
];

export const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;
