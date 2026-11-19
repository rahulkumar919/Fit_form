/**
 * Central image helper. All mock imagery points to verified Unsplash photos
 * so the UI never shows broken images. Swap this single module out when real
 * Cloudinary / server-storage URLs are wired in Phase 2+.
 */

const BASE = "https://images.unsplash.com";

/** Build an optimized Unsplash URL at a given width/height. */
export function img(
  id: string,
  width = 800,
  height = 1000,
  extra = "",
): string {
  const sep = extra ? `&${extra}` : "";
  return `${BASE}/${id}?auto=format&fit=crop&w=${width}&h=${height}&q=80${sep}`;
}

/** Portrait crop (3:4) — product cards. */
export const portrait = (id: string) => img(id, 700, 930);
/** Square crop — swatches / thumbnails. */
export const square = (id: string, w = 300) => img(id, w, w);
/** Wide hero crop. */
export const wide = (id: string, w = 1600, h = 900) => img(id, w, h);

/* Verified pool of men's fashion / clothing Unsplash photo ids. */
export const PHOTO = {
  man1: "photo-1507003211169-0a1dd7228f2d",
  man2: "photo-1500648767791-00dcc994a43e",
  man3: "photo-1492562080023-ab3db95bfbce",
  man4: "photo-1521572163474-6864f9cf17ab",
  man5: "photo-1531123897727-8f129e1688ce",
  man6: "photo-1488161628813-04466f872be2",
  denim1: "photo-1542272604-787c3835535d",
  denim2: "photo-1604176354204-9268737828e4",
  rack: "photo-1542327897-d73f4005b533",
  shoes1: "photo-1520975916090-3105956dac38",
  shoes2: "photo-1549298916-b41d501d3772",
  shoes3: "photo-1551489186-cf8726f514f8",
  man7: "photo-1434389677669-e08b4cac3105",
  man8: "photo-1483985988355-763728e1935b",
  store1: "photo-1441986300917-64674bd600d8",
  man9: "photo-1551232864-3f0890e580d9",
  man10: "photo-1583743814966-8936f5b7be1a",
  man11: "photo-1576995853123-5a10305d93c0",
  man12: "photo-1524504388940-b1c1722653e1",
  man13: "photo-1567401893414-76b7b1e5a7a5",
  man14: "photo-1611601322175-ef8ec8c85f01",
  man15: "photo-1542060748-10c28b62716f",
  man16: "photo-1565374395542-0ce18882c857",
  man17: "photo-1564859228273-274232fdb516",
  redShoe: "photo-1542291026-7eec264c27ff",
  man18: "photo-1606293459339-aa5d34a7b0e1",
  man19: "photo-1608231387042-66d1773070a5",
  man20: "photo-1515886657613-9f3515b0c78f",
  man21: "photo-1502716119720-b23a93e5fe1b",
} as const;
