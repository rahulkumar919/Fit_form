import "server-only";
import { connectDB, hasDB } from "@/lib/db/mongoose";
import { FaqModel } from "@/models/Faq";

export interface PublicFaq {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export async function getPublicFaqs(): Promise<PublicFaq[]> {
  if (!hasDB()) return [];
  try {
    await connectDB();
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const docs = await FaqModel.find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .lean();
    return docs.map((d: any) => ({
      id: String(d._id),
      question: d.question,
      answer: d.answer,
      order: d.order ?? 0,
    }));
  } catch (err) {
    console.error("[faq] DB error:", (err as Error).message);
    return [];
  }
}
