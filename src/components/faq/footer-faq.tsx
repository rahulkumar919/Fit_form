"use client";
import * as React from "react";
import { usePathname } from "next/navigation";
import { FaqSection, type FaqItem } from "./faq-section";

export function FooterFaq({ faqs }: { faqs: FaqItem[] }) {
  const pathname = usePathname();

  // Don't show on the standalone /faq page to avoid duplicate sections,
  // or on checkout pages to avoid distraction
  if (
    pathname === "/faq" ||
    pathname?.startsWith("/checkout") ||
    pathname?.startsWith("/admin")
  ) {
    return null;
  }

  return <FaqSection faqs={faqs} />;
}
