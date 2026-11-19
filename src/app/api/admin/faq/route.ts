/**
 * GET  /api/admin/faq  — list all FAQs (admin)
 * POST /api/admin/faq  — create a new FAQ
 */
import { NextRequest } from "next/server";
import { z } from "zod";
import { connectDB, hasDB } from "@/lib/db/mongoose";
import { FaqModel } from "@/models/Faq";
import { ok, created, badRequest, serverError, zodError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";

/* eslint-disable @typescript-eslint/no-explicit-any */

const createSchema = z.object({
  question: z.string().trim().min(1, "Question is required").max(300),
  answer:   z.string().trim().min(1, "Answer is required").max(2000),
  order:    z.number().int().min(0).optional().default(0),
  isActive: z.boolean().optional().default(true),
});

export async function GET() {
  try {
    const { error } = await requireAdmin();
    if (error) return error;
    if (!hasDB()) return ok({ faqs: [] });

    await connectDB();
    const faqs = await FaqModel.find().sort({ order: 1, createdAt: 1 }).lean();

    return ok({
      faqs: faqs.map((f: any) => ({
        id:       String(f._id),
        question: f.question,
        answer:   f.answer,
        order:    f.order ?? 0,
        isActive: f.isActive ?? true,
        createdAt: new Date(f.createdAt).toISOString(),
      })),
    });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    const { error } = await requireAdmin();
    if (error) return error;
    if (!hasDB()) return badRequest("Database unavailable");

    const body = await req.json().catch(() => null);
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return zodError(parsed.error);

    await connectDB();
    const faq = await FaqModel.create(parsed.data);
    return created({ id: String(faq._id) });
  } catch (err) {
    return serverError(err);
  }
}
