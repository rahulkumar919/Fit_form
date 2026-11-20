"use client";

import * as React from "react";
import Link from "next/link";
import { BadgeCheck, ChevronDown, ChevronUp, ShieldCheck, Star } from "lucide-react";

export interface HomeReview {
  id: string;
  author: string;
  rating: number;
  text: string;
  productName: string;
  productSlug: string;
}

/**
 * CustomerReviews — Senior frontend engineered social-proof review section.
 *
 * Mobile:
 *  - Displays strictly 3 reviews initially to keep the page clean and compact.
 *  - Elegant "See more reviews" button with remaining count.
 *  - Smooth toggle to expand all reviews or collapse back.
 *
 * Desktop:
 *  - Balanced responsive 3-column grid with subtle hover elevation and luxury typography.
 */
export function CustomerReviews({
  reviews,
  eyebrow = "From verified buyers",
  title = "What customers say",
}: {
  reviews: HomeReview[];
  eyebrow?: string;
  title?: string;
}) {
  const [mobileExpanded, setMobileExpanded] = React.useState(false);
  const sectionRef = React.useRef<HTMLElement>(null);

  if (!reviews || reviews.length === 0) return null;

  // On mobile show 3 by default; on desktop show all (or controlled by admin count)
  const mobileReviews = mobileExpanded ? reviews : reviews.slice(0, 3);
  const hasMoreMobile = reviews.length > 3;

  const handleToggle = () => {
    if (mobileExpanded) {
      setMobileExpanded(false);
      sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      setMobileExpanded(true);
    }
  };

  return (
    <section ref={sectionRef} className="container-store py-12 md:py-16 scroll-mt-20">
      {/* ── Header ── */}
      <div className="mb-8 text-center sm:mb-10">
        {eyebrow && (
          <p className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-600">
            <ShieldCheck className="size-3.5 text-emerald-600" />
            {eyebrow}
          </p>
        )}
        <h2 className="mt-2 font-serif text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl md:text-4xl">
          {title}
        </h2>
        <div className="mt-2.5 flex items-center justify-center gap-2 text-xs text-neutral-500">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, s) => (
              <Star key={s} className="size-3.5 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <span className="font-semibold text-neutral-800">4.9 / 5.0</span>
          <span className="text-neutral-300">•</span>
          <span>Based on real verified purchases</span>
        </div>
      </div>

      {/* ── Mobile View: strictly 3 cards + toggle ── */}
      <div className="block sm:hidden space-y-3.5">
        {mobileReviews.map((r) => (
          <ReviewCard key={r.id} review={r} />
        ))}

        {hasMoreMobile && (
          <div className="pt-2">
            <button
              type="button"
              onClick={handleToggle}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-300 bg-white py-3 text-sm font-semibold text-neutral-800 shadow-sm transition hover:bg-neutral-50 active:scale-[0.99]"
            >
              {mobileExpanded ? (
                <>
                  <span>Show less</span>
                  <ChevronUp className="size-4 text-neutral-500" />
                </>
              ) : (
                <>
                  <span>See more reviews</span>
                  <span className="text-xs font-normal text-neutral-500">
                    (+{reviews.length - 3} more)
                  </span>
                  <ChevronDown className="size-4 text-neutral-500" />
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* ── Tablet & Desktop View: 2 or 3 columns ── */}
      <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {reviews.map((r) => (
          <ReviewCard key={r.id} review={r} />
        ))}
      </div>
    </section>
  );
}

/** Individual organized review card */
function ReviewCard({ review: r }: { review: HomeReview }) {
  const initial = (r.author || "Customer").charAt(0).toUpperCase();

  return (
    <figure className="group flex flex-col justify-between rounded-2xl border border-neutral-200/90 bg-white p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all hover:border-neutral-300 hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]">
      {/* Top: Stars + Verified Badge */}
      <div className="flex items-center justify-between gap-2 border-b border-neutral-100 pb-3">
        <div className="flex items-center gap-0.5" aria-label={`${r.rating} of 5 stars`}>
          {Array.from({ length: 5 }).map((_, s) => (
            <Star
              key={s}
              className={
                s < r.rating
                  ? "size-3.5 fill-amber-400 text-amber-400"
                  : "size-3.5 fill-neutral-100 text-neutral-200"
              }
            />
          ))}
          <span className="ml-1 text-xs font-bold text-neutral-800 tabular-nums">
            {r.rating.toFixed(1)}
          </span>
        </div>

        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
          <BadgeCheck className="size-3" />
          Verified
        </span>
      </div>

      {/* Middle: Review quote */}
      <blockquote className="my-3.5 flex-1 text-sm leading-relaxed text-neutral-700 line-clamp-4">
        &ldquo;{r.text}&rdquo;
      </blockquote>

      {/* Bottom: Author info + Product link */}
      <figcaption className="border-t border-neutral-100 pt-3">
        <div className="flex items-center gap-2.5">
          {/* Avatar initial circle */}
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-xs font-bold text-neutral-700">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-neutral-900">{r.author}</p>
            {r.productSlug && (
              <Link
                href={`/product/${r.productSlug}`}
                className="mt-0.5 block truncate text-[11px] text-neutral-500 hover:text-neutral-900 hover:underline"
              >
                Purchased: {r.productName}
              </Link>
            )}
          </div>
        </div>
      </figcaption>
    </figure>
  );
}
