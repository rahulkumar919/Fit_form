"use client";
import * as React from "react";
import { MessageCircleQuestion } from "lucide-react";

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

interface AccordionItemProps {
  faq: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}

function FaqAccordionItem({ faq, isOpen, onToggle }: AccordionItemProps) {
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="group flex w-full items-center justify-between gap-3 py-3.5 sm:py-4 text-left cursor-pointer transition-colors"
        aria-expanded={isOpen}
      >
        <span
          className={`text-[14px] sm:text-[15px] font-semibold leading-snug transition-colors ${
            isOpen ? "text-[#b85b6c]" : "text-gray-900 group-hover:text-gray-700"
          }`}
        >
          {faq.question}
        </span>
        <span
          className={`shrink-0 grid size-6.5 sm:size-7 place-items-center rounded-full transition-all duration-200 ${
            isOpen
              ? "bg-[#b85b6c] text-white shadow-sm"
              : "border border-gray-200 text-gray-400 group-hover:border-gray-300 group-hover:text-gray-600"
          }`}
          aria-hidden="true"
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 12 12"
            fill="none"
            className={`transition-transform duration-200 ${isOpen ? "rotate-45" : ""}`}
          >
            <path
              d="M6 1.5v9M1.5 6h9"
              stroke="currentColor"
              strokeWidth={isOpen ? 2 : 1.8}
              strokeLinecap="round"
            />
          </svg>
        </span>
      </button>

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isOpen ? "grid-rows-[1fr] opacity-100 mb-3.5" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <p className="text-[13px] sm:text-sm text-gray-600 leading-relaxed pr-6 sm:pr-8">
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

  // First item open by default like Floriwish
  const [openId, setOpenId] = React.useState<string | null>(faqs[0]?.id ?? null);

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  // Split items into 2 columns for desktop view
  const half = Math.ceil(faqs.length / 2);
  const leftCol = faqs.slice(0, half);
  const rightCol = faqs.slice(half);

  return (
    <section
      id="faq"
      aria-label="Frequently Asked Questions"
      className={`w-full bg-white px-4 sm:px-6 lg:px-8 py-5 sm:py-8 border-t border-gray-100 ${className}`}
    >
      <div className="mx-auto max-w-5xl">
        {/* Header — Floriwish inline row format */}
        <div className="flex items-center gap-3.5 mb-5 sm:mb-7">
          <span className="grid size-11 sm:size-12 shrink-0 place-items-center rounded-2xl bg-[#feecef] text-[#b85b6c]">
            <MessageCircleQuestion className="size-6 text-[#b85b6c]" strokeWidth={1.8} />
          </span>
          <div className="flex flex-col">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-gray-900 leading-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Everything you need to know about MelaMart
            </p>
          </div>
        </div>

        {/* Accordion Layout: Single column on mobile, 2 columns on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-x-12">
          {/* Left Column (or all items on mobile) */}
          <div className="flex flex-col">
            {leftCol.map((faq) => (
              <FaqAccordionItem
                key={faq.id}
                faq={faq}
                isOpen={openId === faq.id}
                onToggle={() => toggle(faq.id)}
              />
            ))}
          </div>

          {/* Right Column (on desktop) */}
          {rightCol.length > 0 && (
            <div className="flex flex-col border-t border-gray-100 md:border-t-0">
              {rightCol.map((faq) => (
                <FaqAccordionItem
                  key={faq.id}
                  faq={faq}
                  isOpen={openId === faq.id}
                  onToggle={() => toggle(faq.id)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
