/** POST /api/admin/links — create a tracked short link (admin only). */

import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/mongoose";
import { TrackedLinkModel } from "@/models/TrackedLink";
import { conflict, created, serverError, zodError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";
import { logAdminAction } from "@/lib/audit";
import { linkInputSchema } from "@/lib/validations/link";

export async function POST(req: NextRequest) {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    const parsed = linkInputSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return zodError(parsed.error);

    await connectDB();
    if (await TrackedLinkModel.exists({ code: parsed.data.code })) return conflict(`The code "${parsed.data.code}" is already used`);
    const link = await TrackedLinkModel.create(parsed.data);
    await logAdminAction(session!, "link.create", "link", String(link._id), `Created /l/${link.code} → ${link.destination}`);
    return created({ id: String(link._id), code: link.code });
  } catch (err) {
    if ((err as { code?: number }).code === 11000) return conflict("That code is already used");
    return serverError(err);
  }
}
