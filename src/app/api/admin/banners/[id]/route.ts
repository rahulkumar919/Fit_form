/**
 * PATCH  /api/admin/banners/[id] — full edit, or { isActive } quick toggle (admin only)
 * DELETE /api/admin/banners/[id]
 */
import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { BannerModel } from "@/models/Banner";
import { notFound, ok, serverError, zodError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";
import { logAdminAction } from "@/lib/audit";
import { OBJECT_ID_RE } from "@/lib/catalog-constants";
import { bannerInputSchema, bannerPatchSchema } from "@/lib/validations/homepage";
import { afterHomepageChange } from "@/services/homepage";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    const { id } = await params;
    if (!OBJECT_ID_RE.test(id)) return notFound("Banner not found");
    const body = await req.json().catch(() => null);
    const quick = body && typeof body === "object" && Object.keys(body).length === 1 && "isActive" in body;
    const parsed = quick ? bannerPatchSchema.safeParse(body) : bannerInputSchema.safeParse(body);
    if (!parsed.success) return zodError(parsed.error);

    await connectDB();
    const doc = await BannerModel.findById(id);
    if (!doc) return notFound("Banner not found");
    doc.set(parsed.data);
    await doc.save();
    await logAdminAction(session!, "banner.update", "banner", id, quick ? `Banner ${doc.isActive ? "shown" : "hidden"}` : `Updated banner "${doc.title || doc.alt || "image"}"`);
    await afterHomepageChange();
    return ok({ id });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    const { id } = await params;
    if (!OBJECT_ID_RE.test(id)) return notFound("Banner not found");
    await connectDB();
    const doc = await BannerModel.findByIdAndDelete(id);
    if (!doc) return notFound("Banner not found");
    await logAdminAction(session!, "banner.delete", "banner", id, `Deleted banner "${doc.title || doc.alt || "image"}"`);
    await afterHomepageChange();
    return ok({ id });
  } catch (err) {
    return serverError(err);
  }
}
