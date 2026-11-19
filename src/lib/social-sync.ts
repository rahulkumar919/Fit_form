/** Server helpers shared by the social post API routes. */
import { ComboModel } from "@/models/Combo";
import { ProductModel } from "@/models/Product";
import { SocialPostModel } from "@/models/SocialPost";
import { VideoStorageService } from "@/lib/storage/video";

/** The linked combo/product must exist (it may be inactive; the storefront then hides the shop button). */
export async function linkTargetExists(type: "none" | "combo" | "product", id: string | null): Promise<boolean> {
  if (type === "none" || !id) return true;
  return type === "combo" ? !!(await ComboModel.exists({ _id: id })) : !!(await ProductModel.exists({ _id: id }));
}

/** Delete an uploaded video once no post references it any more. */
export async function releaseVideo(url: string): Promise<void> {
  if (!url) return;
  if (await SocialPostModel.exists({ video: url })) return;
  await VideoStorageService.removeByUrl(url).catch((e) => console.warn("[social] video cleanup failed", e));
}
