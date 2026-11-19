/** Client-safe: which video URLs the storefront may play (our /media/videos or our Cloudinary). */
export const SERVER_VIDEO_RE = /^\/media\/videos\/\d{4}\/\d{2}\/[a-f0-9]{16}\.(mp4|webm)$/;
export const CLOUDINARY_VIDEO_RE = /^https:\/\/res\.cloudinary\.com\/[a-z0-9_-]+\/video\/upload\/[^\s?#]+\.(mp4|webm)$/i;

export function isAllowedVideoUrl(v: string): boolean {
  return SERVER_VIDEO_RE.test(v) || CLOUDINARY_VIDEO_RE.test(v);
}
