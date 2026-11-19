import { getPublicFaqs } from "@/services/faq";
import { FaqSection } from "@/components/faq/faq-section";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Frequently Asked Questions | MelaMart",
  description: "Find answers to common questions about MelaMart — shipping, returns, sizing, payments and more.",
};

export default async function FaqPage() {
  const faqs = await getPublicFaqs();
  return <FaqSection faqs={faqs} />;
}
