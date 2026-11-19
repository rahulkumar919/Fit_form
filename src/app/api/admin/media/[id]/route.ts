/** DELETE /api/admin/media/[id] — delete an image (refused while products/combos still use it). */

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { MediaAssetModel } from "@/models/MediaAsset";
import { ProductModel } from "@/models/Product";
import { ComboModel } from "@/models/Combo";
import { conflict, notFound, ok, serverError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";
import { logAdminAction } from "@/lib/audit";
import { ImageStorageService } from "@/lib/storage";
import { OBJECT_ID_RE } from "@/lib/catalog-constants";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    const { id } = await params;
    if (!OBJECT_ID_RE.test(id)) return notFound("Image not found");

    await connectDB();
    const asset = await MediaAssetModel.findById(id);
    if (!asset) return notFound("Image not found");

    const urls = asset.renditions.map((r) => r.url).concat(asset.url);
    const [products, combos] = await Promise.all([
      ProductModel.find({ $or: [{ images: { $in: urls } }, { "variants.images": { $in: urls } }] }).select("name").lean(),
      ComboModel.find({ $or: [{ images: { $in: urls } }, { "items.image": { $in: urls } }] }).select("name").lean(),
    ]);
    const users = [...products, ...combos].map((d) => (d as { name: string }).name);
    if (users.length) return conflict(`Still used by: ${users.slice(0, 5).join(", ")}${users.length > 5 ? "…" : ""}. Remove it there first.`);

    await ImageStorageService.remove(asset.provider, asset.storageKey);
    await asset.deleteOne();
    await logAdminAction(session!, "media.delete", "media", id, `Deleted ${asset.name}`);
    return ok({ id });
  } catch (err) {
    return serverError(err);
  }
}
