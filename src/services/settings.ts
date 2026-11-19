/**
 * Store-wide settings kept in the `settings` collection (one doc per key).
 *
 * All DB calls fall back to defaults on MongoDB errors (DNS failure, cluster
 * paused, IP block) so the site renders instead of crashing.
 * Fix: MongoDB Atlas → Network Access → add 0.0.0.0/0 or your server IP.
 *
 * SERVER-ONLY — never import this from a client component.
 * Import types / defaults from @/services/settings-types instead.
 */
import "server-only";

import { connectDB, hasDB } from "@/lib/db/mongoose";
import { SettingsModel } from "@/models/Settings";
import { availableProviders } from "@/lib/storage";
import { cache } from "@/lib/redis/client";

// Re-export everything from the shared types file so existing imports keep working.
export type { StorageProvider, PartialCodSettings, StoreSettings } from "@/services/settings-types";
export { DEFAULT_PARTIAL_COD, DEFAULT_SETTINGS } from "@/services/settings-types";

// Local aliases for use inside this file.
import type { StoreSettings } from "@/services/settings-types";
import { DEFAULT_PARTIAL_COD, DEFAULT_SETTINGS } from "@/services/settings-types";

const SETTINGS_KEY = "store:settings";
const SETTINGS_TTL = 300; // 5 minutes — invalidated on save

export async function getSettings(): Promise<StoreSettings> {
  if (!hasDB()) return DEFAULT_SETTINGS;
  try {
    // Redis cache first — avoids a MongoDB round-trip on every page render
    const hit = await cache.get(SETTINGS_KEY);
    if (hit) return JSON.parse(hit) as StoreSettings;

    await connectDB();
    const doc = await SettingsModel.findOne({ key: "store" }).lean();
    const raw = (doc?.value as Partial<StoreSettings>) ?? {};
    const merged: StoreSettings = {
      ...DEFAULT_SETTINGS,
      ...raw,
      partialCod: { ...DEFAULT_PARTIAL_COD, ...(raw.partialCod ?? {}) },
    };
    if (!availableProviders().includes(merged.defaultStorage)) merged.defaultStorage = "server";

    await cache.set(SETTINGS_KEY, JSON.stringify(merged), SETTINGS_TTL);
    return merged;
  } catch (err) {
    // DNS failure (ENOTFOUND), cluster paused, or IP block → serve defaults
    console.error("[settings] DB error — using defaults:", (err as Error).message?.slice(0, 120));
    return DEFAULT_SETTINGS;
  }
}

export async function saveSettings(next: StoreSettings): Promise<void> {
  await connectDB();
  await SettingsModel.updateOne({ key: "store" }, { $set: { value: next } }, { upsert: true });
  // Bust the cache so the next request gets fresh data
  await cache.del(SETTINGS_KEY);
}

/** Facts shown next to the buy buttons (shipping, COD, welcome offer). */
export async function getStoreInfo(): Promise<import("@/components/products/purchase").StoreInfo> {
  const { findActiveCoupon } = await import("@/lib/pricing/coupons");
  const [s, welcome] = await Promise.all([getSettings(), findActiveCoupon("NEW10").catch(() => null)]);
  return {
    freeShippingThreshold: s.freeShippingThreshold,
    flatShipping: s.flatShipping,
    codEnabled: s.codEnabled,
    offer: welcome ? { code: welcome.code, description: welcome.description } : null,
  };
}
