/**
 * GET /api/faq — public: returns active FAQs sorted by order
 */
import { connectDB, hasDB } from "@/lib/db/mongoose";
import { FaqModel } from "@/models/Faq";
import { ok, serverError } from "@/lib/api/response";

/* eslint-disable @typescript-eslint/no-explicit-any */

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!hasDB()) return ok({ faqs: [] });

    await connectDB();
    const faqs = await FaqModel.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    return ok({
      faqs: faqs.map((f: any) => ({
        id:       String(f._id),
        question: f.question,
        answer:   f.answer,
      })),
    });
  } catch (err) {
    return serverError(err);
  }
}
