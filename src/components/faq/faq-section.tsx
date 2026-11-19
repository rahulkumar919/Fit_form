"use client";
import * as React from "react";
import { MessageCircleQuestion } from "lucide-react";

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

function FaqAccordionItem({ faq }: { faq: FaqItem }) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="group flex w-full items-center justify-between gap-4 py-4 md:py-5 text-left cursor-pointer transition-colors"
        aria-expanded={open}
      >
        <span className="text-[14px] md:text-[15px] font-semibold text-gray-800 group-hover:text-gray-950 leading-snug">
          {faq.question}
        </span>
        <span
          className={`shrink-0 grid size-7 place-items-center rounded-full border transition-all duration-200 ${
            open
              ? "rotate-45 border-rose-400 bg-rose-50 text-rose-500 shadow-sm"
              : "border-gray-200 text-gray-400 group-hover:border-gray-300 group-hover:text-gray-600"
          }`}
          aria-hidden="true"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M6 1.5v9M1.5 6h9"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </span>
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          open ? "grid-rows-[1fr] opacity-100 mb-4" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="text-[13px] md:text-sm text-gray-600 leading-relaxed pr-8">
            {faq.answer}
          </p>
        </div>
      </div>
    </div>
  );
}

export function FaqSection({
  faqs,
  className = "",
}: {
  faqs: FaqItem[];
  className?: string;
}) {
  if (!faqs || faqs.length === 0) return null;

  // Split items evenly into 2 columns for desktop
  const half = Math.ceil(faqs.length / 2);
  const leftCol = faqs.slice(0, half);
  const rightCol = faqs.slice(half);

  return (
    <section
      id="faq"
      aria-label="Frequently Asked Questions"
      className={`w-full py-12 md:py-16 px-3 sm:px-6 lg:px-8 bg-[#f8f9fa] ${className}`}
    >
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl border border-gray-200/70 bg-white p-6 sm:p-10 lg:p-14 shadow-sm">
          {/* Header */}
          <div className="flex flex-col items-center text-center">
            <span className="mb-3.5 grid size-12 place-items-center rounded-2xl bg-rose-50 text-rose-500 ring-4 ring-rose-50/50">
              <MessageCircleQuestion className="size-6 text-rose-500" strokeWidth={1.8} />
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-xs md:text-sm text-gray-500">
              Everything you need to know about MelaMart
            </p>
          </div>

          {/* 2-column Accordion Grid */}
          <div className="mt-8 md:mt-12 grid grid-cols-1 md:grid-cols-2 gap-x-12 lg:gap-x-16">
            <div className="flex flex-col">
              {leftCol.map((faq) => (
                <FaqAccordionItem key={faq.id} faq={faq} />
              ))}
            </div>

            <div className="flex flex-col border-t border-gray-100 md:border-t-0 mt-2 md:mt-0 pt-2 md:pt-0">
              {rightCol.map((faq) => (
                <FaqAccordionItem key={faq.id} faq={faq} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
