import { connectDB, hasDB } from "@/lib/db/mongoose";
import { FaqModel } from "@/models/Faq";
import { FaqManager } from "@/components/admin/faq-manager";

export const dynamic = "force-dynamic";

async function getFaqs() {
  if (!hasDB()) return [];
  await connectDB();
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const faqs = await FaqModel.find().sort({ order: 1, createdAt: 1 }).lean();
  return faqs.map((f: any) => ({
    id:       String(f._id),
    question: f.question,
    answer:   f.answer,
    order:    f.order ?? 0,
    isActive: f.isActive ?? true,
    createdAt: new Date(f.createdAt).toISOString(),
  }));
}

export default async function AdminFaqPage() {
  const faqs = await getFaqs();
  return <FaqManager initialFaqs={faqs} />;
}
