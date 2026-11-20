"use client";

/**
 * ProductReviewsSection — Floriwish-style reviews area on the product detail page.
 *
 * Layout (matches Floriwish exactly):
 *  ┌──────────────────────────────────────────┐
 *  │  All Reviews          ✏ Write a Review   │
 *  ├──────────────────────────────────────────┤
 *  │  4.9  ★★★★★           5 ████████  78%   │
 *  │  295 reviews ✓         4 ██       16%   │
 *  │                        3 █         4%   │
 *  │                        2 ░         1%   │
 *  │                        1 ░         1%   │
 *  ├──────────────────────────────────────────┤
 *  │  [✓ 100% Verified Purchases] [📷 Photos]│
 *  ├──────────────────────────────────────────┤
 *  │  B  Bhupendra Kumara ✓          Jun 2026 │
 *  │     ★★★★★ 5.0  📍 Mumbai                │
 *  │     I ordered a flower bouquet ...       │
 *  │     ✓ Verified Purchase   👍 Helpful (9) │
 *  └──────────────────────────────────────────┘
 */

import * as React from "react";
import Image from "next/image";
import {
  BadgeCheck,
  Camera,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MapPin,
  MessageSquare,
  Pencil,
  ShieldCheck,
  Store,
  ThumbsUp,
} from "lucide-react";
import { toast } from "sonner";
import type { PublicReview, ReviewSummary } from "@/services/reviews";
import { RatingStars } from "@/components/products/rating-stars";
import { ReviewForm } from "@/components/products/review-form";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ─────────────────────────── types ─────────────────────────── */

type SortKey = "newest" | "highest" | "lowest" | "helpful";

/* ─────────────────────── RatingBar row ─────────────────────── */

function RatingBar({
  star,
  pct,
  active,
  onClick,
}: {
  star: number;
  pct: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 group py-0.5"
      aria-pressed={active}
    >
      {/* star number */}
      <span className="w-2.5 shrink-0 text-xs font-medium text-gray-700 text-right">{star}</span>
      {/* gold star icon */}
      <svg className="size-3 shrink-0 fill-amber-400" viewBox="0 0 20 20">
        <path d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 13.27l-4.77 2.44.91-5.32L2.27 6.62l5.34-.78L10 1z" />
      </svg>
      {/* progress bar */}
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
            active ? "bg-amber-500" : "bg-amber-400 group-hover:bg-amber-500",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {/* percent */}
      <span className="w-7 shrink-0 text-right text-xs text-gray-500 tabular-nums">{pct}%</span>
    </button>
  );
}

/* ──────────────────────── ReviewCard ───────────────────────── */

function ReviewCard({
  review,
  onHelpful,
  voted,
}: {
  review: PublicReview;
  onHelpful: (id: string) => void;
  voted: boolean;
}) {
  const initials = review.author.slice(0, 1).toUpperCase();
  const monthYear = new Date(review.date).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });

  return (
    <article className="border-b border-gray-100 py-5 last:border-0">
      {/* Row 1: Avatar + Name + Badge + Date */}
      <div className="flex items-start gap-3">
        {/* Avatar circle */}
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-700 uppercase">
          {review.customerImage ? (
            <Image
              src={review.customerImage}
              alt={review.author}
              width={36}
              height={36}
              className="size-9 rounded-full object-cover"
            />
          ) : (
            initials
          )}
        </div>

        <div className="flex-1 min-w-0">
          {/* Name + verified */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-semibold text-gray-900 leading-tight">
              {review.author}
            </span>
            {(review.verified || review.source === "store_testimonial") && (
              <BadgeCheck className="size-4 shrink-0 text-blue-500" />
            )}
            {review.source === "store_testimonial" && (
              <span className="flex items-center gap-0.5 text-[10px] text-sky-600 font-medium">
                <Store className="size-3" /> Store
              </span>
            )}
          </div>
          {/* Stars row */}
          <div className="mt-1 flex items-center gap-1.5">
            <RatingStars rating={review.rating} showCount={false} size="sm" />
            <span className="text-xs font-semibold text-amber-600 tabular-nums">
              {review.rating.toFixed(1)}
            </span>
            {/* location placeholder */}
            <span className="flex items-center gap-0.5 text-[11px] text-gray-400 ml-1">
              <MapPin className="size-2.5" /> India
            </span>
          </div>
        </div>

        {/* Date — top right */}
        <time className="shrink-0 text-[11px] text-gray-400">{monthYear}</time>
      </div>

      {/* Row 2: Title */}
      {review.title && (
        <p className="mt-2.5 text-sm font-semibold text-gray-900 leading-snug line-clamp-1">
          {review.title}
        </p>
      )}

      {/* Row 3: Body */}
      <p className="mt-1.5 text-sm leading-relaxed text-gray-600 line-clamp-4">{review.body}</p>

      {/* Row 4: Images */}
      {review.images.length > 0 && (
        <div className="mt-3 flex gap-2">
          {review.images.slice(0, 3).map((img, i) => (
            <div key={i} className="relative size-14 overflow-hidden rounded-lg bg-gray-100">
              <Image src={img} alt={`Review photo ${i + 1}`} fill sizes="56px" className="object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Row 5: Footer */}
      <div className="mt-3 flex items-center gap-4">
        {review.verified && review.source !== "store_testimonial" && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
            <ShieldCheck className="size-3" /> Verified Purchase
          </span>
        )}
        <button
          type="button"
          onClick={() => onHelpful(review.id)}
          className={cn(
            "ml-auto flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors",
            voted
              ? "border-gray-300 bg-gray-100 text-gray-500"
              : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50",
          )}
          aria-label="Mark as helpful"
        >
          <ThumbsUp className="size-3" />
          Helpful{review.helpfulCount > 0 && (
            <span className="tabular-nums">({review.helpfulCount})</span>
          )}
        </button>
      </div>
    </article>
  );
}

/* ─────────────────────── Write a Review Modal ───────────────── */

function WriteReviewModal({ productId, onClose }: { productId: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-1.5 text-gray-400 hover:bg-gray-100"
          aria-label="Close"
        >
          ✕
        </button>
        <div className="p-6">
          <ReviewForm productId={productId} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */

interface Props {
  productId: string;
  initialReviews: PublicReview[];
  summary: ReviewSummary;
}

export function ProductReviewsSection({ productId, initialReviews, summary }: Props) {
  const [reviews, setReviews] = React.useState<PublicReview[]>(initialReviews);
  const [sort] = React.useState<SortKey>("newest");
  const [starFilter, setStarFilter] = React.useState<number>(0);
  const [page, setPage] = React.useState(1);
  const [hasMore, setHasMore] = React.useState(initialReviews.length >= 10);
  const [loading, setLoading] = React.useState(false);
  const [helpfulVoted, setHelpfulVoted] = React.useState<Set<string>>(new Set());
  const [showModal, setShowModal] = React.useState(false);

  const scrollRef = React.useRef<HTMLDivElement>(null);

  /* ── fetch helper ── */
  const fetchReviews = React.useCallback(
    async (newSort: SortKey, newStar: number, newPage: number, append: boolean) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          productId,
          sort: newSort,
          star: String(newStar),
          page: String(newPage),
          limit: "10",
        });
        const res = await fetch(`/api/reviews?${params}`);
        const json = await res.json().catch(() => ({}));
        if (!json.success) return;
        const incoming: PublicReview[] = json.data.reviews ?? [];
        setReviews((prev) => (append ? [...prev, ...incoming] : incoming));
        setHasMore(json.data.hasMore ?? false);
      } finally {
        setLoading(false);
      }
    },
    [productId],
  );

  const changeStar = (newStar: number) => {
    const next = starFilter === newStar ? 0 : newStar;
    setStarFilter(next);
    setPage(1);
    fetchReviews(sort, next, 1, false);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchReviews(sort, starFilter, nextPage, true);
  };

  const handleHelpful = async (reviewId: string) => {
    if (helpfulVoted.has(reviewId)) {
      toast.info("You already marked this review as helpful");
      return;
    }
    try {
      const res = await fetch("/api/reviews/helpful", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 409) { setHelpfulVoted((s) => new Set(s).add(reviewId)); return; }
        if (res.status === 401) { toast.error("Sign in to mark reviews as helpful"); return; }
        return;
      }
      if (json.success) {
        setHelpfulVoted((s) => new Set(s).add(reviewId));
        const newCount: number = json.data.helpfulCount;
        setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, helpfulCount: newCount } : r)));
        toast.success("Thanks for your feedback!");
      }
    } catch { /* silent */ }
  };

  /* ── horizontal scroll helpers (desktop) ── */
  const scrollBy = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
  };

  /* ── empty state ── */
  if (summary.count === 0) {
    return (
      <div className="mt-6 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col items-start gap-2">
          <MessageSquare className="size-6 text-gray-300" />
          <p className="font-medium text-gray-800">No reviews yet</p>
          <p className="text-sm text-gray-500">
            Reviews here come only from customers who have received this product.
          </p>
          <Button size="sm" variant="outline" onClick={() => setShowModal(true)} className="mt-2 gap-1.5">
            <Pencil className="size-3.5" /> Write a Review
          </Button>
        </div>
        {showModal && <WriteReviewModal productId={productId} onClose={() => setShowModal(false)} />}
      </div>
    );
  }

  /* ── rating breakdown bars (5→1) ── */
  const breakdownDesc = [...summary.breakdown].sort((a, b) => b.star - a.star);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden lg:rounded-none lg:border-0 lg:shadow-none lg:bg-transparent">

      {/* ══ HEADER ══ */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 sm:px-6">
        <h2 className="text-base font-bold text-gray-900 sm:text-lg">All Reviews</h2>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 sm:text-sm sm:px-4 sm:py-2"
        >
          <Pencil className="size-3 sm:size-3.5" />
          Write a Review
        </button>
      </div>

      {/* ══ RATING SUMMARY ══ */}
      <div className="flex items-center gap-6 border-t border-gray-100 px-5 py-5 sm:gap-10 sm:px-6">
        {/* Left: big score */}
        <div className="flex shrink-0 flex-col items-center gap-1">
          <span className="text-5xl font-extrabold tabular-nums leading-none text-gray-900">
            {summary.average.toFixed(1)}
          </span>
          <RatingStars rating={summary.average} showCount={false} size="md" />
          <span className="flex items-center gap-1 text-xs text-gray-400">
            {summary.count} reviews
            <BadgeCheck className="size-3 text-blue-500" />
          </span>
        </div>

        {/* Right: rating bars */}
        <div className="flex flex-1 flex-col gap-1 min-w-0">
          {breakdownDesc.map((b) => {
            const pct = summary.count ? Math.round((b.count / summary.count) * 100) : 0;
            return (
              <RatingBar
                key={b.star}
                star={b.star}
                pct={pct}
                active={starFilter === b.star}
                onClick={() => changeStar(b.star)}
              />
            );
          })}
        </div>
      </div>

      {/* ══ TRUST BADGE PILLS ══ */}
      <div className="flex flex-wrap items-center gap-2.5 border-t border-gray-100 px-5 py-3 sm:px-6">
        <span className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
          <ShieldCheck className="size-3.5 text-emerald-500" /> 100% Verified Purchases
        </span>
        <span className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600">
          <Camera className="size-3.5 text-blue-500" /> Customer Photos
        </span>
        {starFilter !== 0 && (
          <button
            type="button"
            onClick={() => changeStar(0)}
            className="ml-auto flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs font-medium text-rose-600 hover:bg-rose-100 transition"
          >
            {starFilter}★ filter ✕
          </button>
        )}
      </div>

      {/* ══ REVIEW LIST ══ */}
      {/* Mobile: vertical list | Desktop: horizontal scroll carousel */}
      <div className="border-t border-gray-100">

        {loading && reviews.length === 0 ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-6 animate-spin text-gray-400" />
          </div>
        ) : reviews.length === 0 ? (
          <p className="p-6 text-center text-sm text-gray-400">No reviews match your filter.</p>
        ) : (
          <>
            {/* ── Mobile: vertical stacked list — page scrolls naturally ── */}
            <div className="block md:hidden px-5 divide-y divide-gray-100">
              {reviews.map((r) => (
                <ReviewCard
                  key={r.id}
                  review={r}
                  onHelpful={handleHelpful}
                  voted={helpfulVoted.has(r.id)}
                />
              ))}
              {/* Load more */}
              {hasMore && (
                <div className="py-4 flex justify-center">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={loading}
                    onClick={loadMore}
                    className="w-full gap-1.5 rounded-full text-xs"
                  >
                    {loading ? <Loader2 className="size-4 animate-spin" /> : "Load more reviews"}
                  </Button>
                </div>
              )}
            </div>

            {/* ── Desktop: horizontal scroll cards ── */}
            <div className="relative hidden md:block px-6 py-5">
              {/* Left arrow */}
              <button
                type="button"
                onClick={() => scrollBy("left")}
                aria-label="Scroll left"
                className="absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-full border border-gray-200 bg-white p-1.5 shadow-md transition hover:bg-gray-50"
              >
                <ChevronLeft className="size-4" />
              </button>

              {/* Cards row */}
              <div
                ref={scrollRef}
                className="flex gap-4 overflow-x-auto scroll-smooth pb-2 px-6"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {reviews.map((r) => (
                  <DesktopReviewCard
                    key={r.id}
                    review={r}
                    onHelpful={handleHelpful}
                    voted={helpfulVoted.has(r.id)}
                  />
                ))}

                {/* Load more sentinel */}
                {hasMore && (
                  <div className="flex w-40 shrink-0 items-center justify-center rounded-2xl border border-dashed border-gray-200">
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={loading}
                      onClick={loadMore}
                      className="flex-col gap-1 h-auto py-4 text-xs"
                    >
                      {loading ? (
                        <Loader2 className="size-5 animate-spin" />
                      ) : (
                        <>
                          <ChevronRight className="size-5" />
                          Load more
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {/* Right arrow */}
              <button
                type="button"
                onClick={() => scrollBy("right")}
                aria-label="Scroll right"
                className="absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full border border-gray-200 bg-white p-1.5 shadow-md transition hover:bg-gray-50"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>


          </>
        )}
      </div>

      {/* ── Write Review Modal ── */}
      {showModal && <WriteReviewModal productId={productId} onClose={() => setShowModal(false)} />}
    </div>
  );
}

/* ──────────────────────── Desktop Review Card ───────────────────────── */

function DesktopReviewCard({
  review,
  onHelpful,
  voted,
}: {
  review: PublicReview;
  onHelpful: (id: string) => void;
  voted: boolean;
}) {
  const initials = review.author.slice(0, 1).toUpperCase();
  const monthYear = new Date(review.date).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });

  return (
    <article className="flex w-72 shrink-0 flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-700 uppercase">
            {review.customerImage ? (
              <Image
                src={review.customerImage}
                alt={review.author}
                width={36}
                height={36}
                className="size-9 rounded-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="truncate text-sm font-semibold leading-tight">{review.author}</p>
              {(review.verified || review.source === "store_testimonial") && (
                <BadgeCheck className="size-4 shrink-0 text-blue-500" />
              )}
            </div>
            <p className="text-[11px] text-gray-400 leading-tight mt-0.5">
              {review.source === "store_testimonial" ? (
                <span className="flex items-center gap-0.5 text-sky-600">
                  <Store className="size-3" /> Store
                </span>
              ) : (
                <span className="flex items-center gap-0.5">
                  <BadgeCheck className="size-3 text-emerald-500" /> Verified
                </span>
              )}
            </p>
          </div>
        </div>
        <time className="shrink-0 text-[11px] text-gray-400">{monthYear}</time>
      </div>

      {/* Stars */}
      <div className="flex items-center gap-1.5">
        <RatingStars rating={review.rating} showCount={false} size="sm" />
        <span className="text-xs font-semibold tabular-nums text-amber-600">{review.rating.toFixed(1)}</span>
      </div>

      {/* Title */}
      {review.title && (
        <p className="text-sm font-semibold leading-snug line-clamp-1">{review.title}</p>
      )}

      {/* Body */}
      <p className="flex-1 text-sm leading-relaxed text-gray-500 line-clamp-4">{review.body}</p>

      {/* Images */}
      {review.images.length > 0 && (
        <div className="flex gap-1.5">
          {review.images.slice(0, 3).map((img, i) => (
            <div key={i} className="relative size-14 overflow-hidden rounded-lg bg-gray-100">
              <Image src={img} alt={`Review photo ${i + 1}`} fill sizes="56px" className="object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 pt-2.5">
        {review.verified && review.source !== "store_testimonial" && (
          <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
            <ShieldCheck className="size-3" /> Verified Purchase
          </span>
        )}
        <button
          type="button"
          onClick={() => onHelpful(review.id)}
          className={cn(
            "ml-auto flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium transition-colors",
            voted
              ? "border-gray-200 bg-gray-100 text-gray-400"
              : "border-gray-200 text-gray-500 hover:bg-gray-50",
          )}
          aria-label="Mark as helpful"
        >
          <ThumbsUp className="size-3" />
          Helpful{review.helpfulCount > 0 && (
            <span className="tabular-nums">({review.helpfulCount})</span>
          )}
        </button>
      </div>
    </article>
  );
}
