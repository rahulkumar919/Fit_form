/** Homepage content: hero banners + layout settings (Admin → Homepage). */
import { revalidatePath } from "next/cache";
import { connectDB, hasDB } from "@/lib/db/mongoose";
import { BannerModel, type IBanner } from "@/models/Banner";
import { SettingsModel } from "@/models/Settings";
import { cache } from "@/lib/redis/client";
import { DEFAULT_HOMEPAGE, mergeHomepage, type BannerView } from "@/lib/homepage";
import type { HomepageSettings } from "@/lib/validations/homepage";

const BANNERS_KEY = "banners:all-active";

type BannerDoc = IBanner & { _id: unknown };

export function toBannerView(d: BannerDoc): BannerView {
  return {
    id: String(d._id),
    title: d.title ?? "",
    subtitle: d.subtitle ?? "",
    eyebrow: d.eyebrow ?? "",
    image: d.image,
    mobileImage: d.mobileImage ?? "",
    alt: d.alt ?? "",
    ctaLabel: d.ctaLabel ?? "",
    ctaHref: d.ctaHref ?? "",
    highlights: d.highlights ?? [],
    theme: d.theme === "light" ? "light" : "dark",
    overlay: d.overlay !== false,
  };
}

/** Active banners currently inside their schedule window, in display order. */
export async function getLiveBanners(now = new Date()): Promise<BannerView[]> {
  if (!hasDB()) return [];
  let docs: (BannerDoc & { startsAt?: string | Date | null; endsAt?: string | Date | null })[];
  try {
    const hit = await cache.get(BANNERS_KEY);
    if (hit) {
      docs = JSON.parse(hit);
    } else {
      await connectDB();
      docs = JSON.parse(JSON.stringify(await BannerModel.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).limit(20).lean()));
      await cache.set(BANNERS_KEY, JSON.stringify(docs), 300);
    }
  } catch (err) {
    console.error("[banners] DB error:", (err as Error).message?.slice(0, 120));
    return [];
  }
  // Schedule is applied at read time so cached data never shows an expired banner.
  return docs
    .filter((d) => (!d.startsAt || new Date(d.startsAt) <= now) && (!d.endsAt || new Date(d.endsAt) > now))
    .map(toBannerView);
}

export interface AdminBannerRow extends BannerView {
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  status: "live" | "scheduled" | "expired" | "hidden";
}

export async function getAdminBanners(now = new Date()): Promise<AdminBannerRow[]> {
  if (!hasDB()) return [];
  await connectDB();
  const docs = await BannerModel.find().sort({ order: 1, createdAt: 1 }).lean<BannerDoc[]>();
  return docs.map((d) => {
    const startsAt = d.startsAt ? new Date(d.startsAt) : null;
    const endsAt = d.endsAt ? new Date(d.endsAt) : null;
    const status: AdminBannerRow["status"] = !d.isActive
      ? "hidden"
      : startsAt && startsAt > now
        ? "scheduled"
        : endsAt && endsAt <= now
          ? "expired"
          : "live";
    return {
      ...toBannerView(d),
      isActive: !!d.isActive,
      startsAt: startsAt?.toISOString() ?? null,
      endsAt: endsAt?.toISOString() ?? null,
      status,
    };
  });
}

const HOMEPAGE_SETTINGS_KEY = "homepage:settings";
const HOMEPAGE_SETTINGS_TTL = 300; // 5 minutes

/* ── layout settings (settings collection, key "homepage") ── */

export async function getHomepageSettings(): Promise<HomepageSettings> {
  if (!hasDB()) return DEFAULT_HOMEPAGE;
  try {
    const hit = await cache.get(HOMEPAGE_SETTINGS_KEY);
    if (hit) return JSON.parse(hit) as HomepageSettings;

    await connectDB();
    const doc = await SettingsModel.findOne({ key: "homepage" }).lean<{ value?: unknown }>();
    const result = mergeHomepage(doc?.value);

    await cache.set(HOMEPAGE_SETTINGS_KEY, JSON.stringify(result), HOMEPAGE_SETTINGS_TTL);
    return result;
  } catch (err) {
    console.error("[homepage] DB error — using defaults:", (err as Error).message?.slice(0, 120));
    return DEFAULT_HOMEPAGE;
  }
}

export async function saveHomepageSettings(next: HomepageSettings): Promise<void> {
  await connectDB();
  await SettingsModel.updateOne({ key: "homepage" }, { $set: { value: next } }, { upsert: true });
  await cache.del(HOMEPAGE_SETTINGS_KEY);
}

/** Call after banner / homepage-layout writes. */
export async function afterHomepageChange(): Promise<void> {
  await cache.del(BANNERS_KEY, HOMEPAGE_SETTINGS_KEY);
  revalidatePath("/", "page");
}

/** Call after category writes: nav (layout) + homepage + shop pages. */
export async function afterCategoryChange(): Promise<void> {
  await cache.del("categories:all");
  revalidatePath("/", "layout");
}

/* ── Instagram posts / reels ── */
import { SocialPostModel, type ISocialPost } from "@/models/SocialPost";
import { getAllCombos, getAllProducts } from "@/services/catalog";
import type { SocialView } from "@/lib/homepage";

const SOCIAL_KEY = "social:active";
type SocialDoc = ISocialPost & { _id: unknown };

async function resolveShopLinks(docs: SocialDoc[]): Promise<SocialView[]> {
  const needsCombos = docs.some((d) => d.linkType === "combo");
  const needsProducts = docs.some((d) => d.linkType === "product");
  const [combos, products] = await Promise.all([
    needsCombos ? getAllCombos() : Promise.resolve([]),
    needsProducts ? getAllProducts() : Promise.resolve([]),
  ]);
  const comboById = new Map(combos.map((c) => [c.id, c]));
  const productById = new Map(products.map((p) => [p.id, p]));
  return docs.map((d) => {
    let shop: SocialView["shop"] = null;
    const id = d.linkId ? String(d.linkId) : "";
    if (d.linkType === "combo" && comboById.has(id)) {
      const c = comboById.get(id)!;
      shop = { type: "combo", name: c.name, href: `/combo/${c.slug}`, price: c.comboPrice, image: c.images[0] ?? "" };
    } else if (d.linkType === "product" && productById.has(id)) {
      const p = productById.get(id)!;
      shop = { type: "product", name: p.name, href: `/product/${p.slug}`, price: p.price, image: p.images[0] ?? "" };
    }
    return {
      id: String(d._id),
      kind: d.kind === "post" ? "post" : "reel",
      instagramUrl: d.instagramUrl,
      image: d.image,
      video: d.video ?? "",
      caption: d.caption ?? "",
      showInReels: d.showInReels !== false,
      showInGallery: d.showInGallery !== false,
      shop,
    };
  });
}

/** Active posts in admin order, with shop links resolved against the live catalog. */
export async function getLiveSocialPosts(): Promise<SocialView[]> {
  if (!hasDB()) return [];
  let docs: SocialDoc[];
  const hit = await cache.get(SOCIAL_KEY);
  if (hit) docs = JSON.parse(hit);
  else {
    await connectDB();
    docs = JSON.parse(JSON.stringify(await SocialPostModel.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).limit(60).lean()));
    await cache.set(SOCIAL_KEY, JSON.stringify(docs), 300);
  }
  return resolveShopLinks(docs);
}

export interface AdminSocialRow extends SocialView {
  isActive: boolean;
  linkType: "none" | "combo" | "product";
  linkId: string;
}

export async function getAdminSocialPosts(): Promise<AdminSocialRow[]> {
  if (!hasDB()) return [];
  await connectDB();
  const docs = JSON.parse(JSON.stringify(await SocialPostModel.find().sort({ order: 1, createdAt: 1 }).lean())) as SocialDoc[];
  const views = await resolveShopLinks(docs);
  return views.map((v, i) => ({
    ...v,
    isActive: docs[i].isActive !== false,
    linkType: docs[i].linkType ?? "none",
    linkId: docs[i].linkId ? String(docs[i].linkId) : "",
  }));
}

export async function afterSocialChange(): Promise<void> {
  await cache.del(SOCIAL_KEY);
  revalidatePath("/", "page");
}
