/**
 * PATCH  /api/admin/faq/[id] — update a FAQ
 * DELETE /api/admin/faq/[id] — delete a FAQ
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB, hasDB } from "@/lib/db/mongoose";
import { FaqModel } from "@/models/Faq";
import { ok, badRequest, notFound, serverError, zodError, noContent } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";

/* eslint-disable @typescript-eslint/no-explicit-any */

const updateSchema = z.object({
  question: z.string().trim().min(1).max(300).optional(),
  answer:   z.string().trim().min(1).max(2000).optional(),
  order:    z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;
    if (!hasDB()) return badRequest("Database unavailable");

    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return zodError(parsed.error);

    await connectDB();
    const faq = await FaqModel.findByIdAndUpdate(
      id,
      { $set: parsed.data },
      { new: true },
    ).lean();
    if (!faq) return notFound("FAQ not found");

    return ok({ id: String((faq as any)._id) });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;
    if (!hasDB()) return badRequest("Database unavailable");

    const { id } = await params;
    await connectDB();
    const faq = await FaqModel.findByIdAndDelete(id).lean();
    if (!faq) return notFound("FAQ not found");

    return noContent();
  } catch (err) {
    return serverError(err);
  }
}
