/**
 * PATCH  /api/admin/links/[id] — edit a tracked link (code is permanent once shared)
 * DELETE /api/admin/links/[id] — delete a tracked link (its history stays in analytics)
 */

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { TrackedLinkModel } from "@/models/TrackedLink";
import { badRequest, notFound, ok, serverError, zodError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";
import { logAdminAction } from "@/lib/audit";
import { linkInputSchema } from "@/lib/validations/link";
import { OBJECT_ID_RE } from "@/lib/catalog-constants";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    const { id } = await params;
    if (!OBJECT_ID_RE.test(id)) return notFound("Link not found");
    const parsed = linkInputSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return zodError(parsed.error);

    await connectDB();
    const link = await TrackedLinkModel.findById(id);
    if (!link) return notFound("Link not found");
    if (parsed.data.code !== link.code) return badRequest("A link's code cannot change after it is created (it may already be shared)");
    link.set({ name: parsed.data.name, channel: parsed.data.channel, campaign: parsed.data.campaign, destination: parsed.data.destination, isActive: parsed.data.isActive });
    await link.save();
    await logAdminAction(session!, "link.update", "link", id, `Updated /l/${link.code}`);
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
    if (!OBJECT_ID_RE.test(id)) return notFound("Link not found");
    await connectDB();
    const link = await TrackedLinkModel.findByIdAndDelete(id);
    if (!link) return notFound("Link not found");
    await logAdminAction(session!, "link.delete", "link", id, `Deleted /l/${link.code}`);
    return ok({ id });
  } catch (err) {
    return serverError(err);
  }
}
