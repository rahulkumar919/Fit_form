"use client";

/**
 * ProductReviewsSection — Floriwish-style reviews area on the product detail page.
 *
 * Layout:
 *  ┌─────────────────────────────────────────────────────────────┐
 *  │  All Reviews                          ✏ Write a Review btn  │
 *  ├──────────────────────┬──────────────────────────────────────┤
 *  │  4.3  ★★★★☆         │  5 ██████████████████░░░░░  52%      │
 *  │  333 reviews ✓       │  4 ████████████░░░░░░░░░░░  30%      │
 *  │                      │  3 ████░░░░░░░░░░░░░░░░░░░  12%      │
 *  │                      │  2 █░░░░░░░░░░░░░░░░░░░░░░   4%      │
 *  │                      │  1 █░░░░░░░░░░░░░░░░░░░░░░   2%      │
 *  ├──────────────────────┴──────────────────────────────────────┤
 *  │  ✓ 100% Verified  📷 Customer Photos  ✓ Authentic Feedback  │
 *  ├─────────────────────────────────────────────────────────────┤
 *  │  ◀  [Card] [Card] [Card] [Card]  ▶   (horizontal scroll)    │
 *  └─────────────────────────────────────────────────────────────┘
 */

import * as React from "react";
import Image from "next/image";
import {
  BadgeCheck,
  Camera,
  ChevronLeft,
  ChevronRight,
  Loader2,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/* ─────────────────────────── types ─────────────────────────── */

type SortKey = "newest" | "highest" | "lowest" | "helpful";

/* ─────────────────────── RatingBar row ─────────────────────── */

function RatingBar({ star, pct, active, onClick }: { star: number; pct: number; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 group"
      aria-pressed={active}
    >
      <span className="w-3 shrink-0 text-xs font-medium text-foreground">{star}</span>
      {/* gold star icon */}
      <svg className="size-3.5 shrink-0 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
        <path d="M10 1l2.39 4.84 5.34.78-3.87 3.77.91 5.32L10 13.27l-4.77 2.44.91-5.32L2.27 6.62l5.34-.78L10 1z" />
      </svg>
      {/* progress bar */}
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full transition-all duration-500",
            active ? "bg-amber-500" : "bg-amber-400 group-hover:bg-amber-500",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 shrink-0 text-right text-xs text-muted-foreground tabular-nums">{pct}%</span>
    </button>
  );
}

/* ──────────────────────── ReviewCard ───────────────────────── */

function ReviewCard({ review, onHelpful }: { review: PublicReview; onHelpful: (id: string) => void }) {
  const initials = review.author.slice(0, 1).toUpperCase();
  const monthYear = new Date(review.date).toLocaleDateString("en-IN", {
    month: "short",
    year: "numeric",
  });

  return (
    <article className="flex w-72 shrink-0 flex-col gap-3 rounded-2xl border border-border bg-white p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Avatar className="size-9 shrink-0 ring-2 ring-amber-100">
            {review.customerImage && <AvatarImage src={review.customerImage} alt={review.author} />}
            <AvatarFallback className="bg-amber-50 text-amber-700 font-semibold text-sm">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="truncate text-sm font-semibold leading-tight">{review.author}</p>
              {(review.verified || review.source === "store_testimonial") && (
                <BadgeCheck className="size-3.5 shrink-0 text-blue-500" />
              )}
            </div>
            {/* location placeholder – reviews don't carry location, we skip gracefully */}
            <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">
              {review.source === "store_testimonial" ? (
                <span className="flex items-center gap-0.5 text-sky-600">
                  <Store className="size-3" /> Store Testimonial
                </span>
              ) : (
                <span className="flex items-center gap-0.5">
                  <BadgeCheck className="size-3 text-emerald-500" /> Verified
                </span>
              )}
            </p>
          </div>
        </div>
        <time className="shrink-0 text-[11px] text-muted-foreground">{monthYear}</time>
      </div>

      {/* Stars + rating number */}
      <div className="flex items-center gap-1.5">
        <RatingStars rating={review.rating} showCount={false} size="sm" />
        <span className="text-xs font-semibold tabular-nums text-amber-600">{review.rating.toFixed(1)}</span>
      </div>

      {/* Title */}
      {review.title && (
        <p className="text-sm font-semibold leading-snug line-clamp-1">{review.title}</p>
      )}

      {/* Body */}
      <p className="flex-1 text-sm leading-relaxed text-muted-foreground line-clamp-4">{review.body}</p>

      {/* Images */}
      {review.images.length > 0 && (
        <div className="flex gap-1.5">
          {review.images.slice(0, 3).map((img, i) => (
            <div key={i} className="relative size-14 overflow-hidden rounded-lg bg-muted">
              <Image src={img} alt={`Review photo ${i + 1}`} fill sizes="56px" className="object-cover" />
            </div>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border pt-2.5">
        {review.verified && review.source !== "store_testimonial" && (
          <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
            <ShieldCheck className="size-3" /> Verified Purchase
          </span>
        )}
        <button
          type="button"
          onClick={() => onHelpful(review.id)}
          className="ml-auto flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Mark as helpful"
        >
          <ThumbsUp className="size-3" />
          Helpful{review.helpfulCount > 0 && <span className="tabular-nums">({review.helpfulCount})</span>}
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
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted"
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

  /* ── horizontal scroll helpers ── */
  const scrollBy = (dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
  };

  /* ── empty state ── */
  if (summary.count === 0) {
    return (
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="flex flex-col items-start gap-2 rounded-2xl border border-dashed border-border bg-card p-6">
          <MessageSquare className="size-6 text-muted-foreground" />
          <p className="font-medium">No reviews yet</p>
          <p className="text-sm text-muted-foreground">
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
    <div className="mt-6 space-y-0 rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
      {/* ── Section header ── */}
      <div className="flex items-center justify-between px-6 pt-5 pb-4">
        <h2 className="text-lg font-bold tracking-tight">All Reviews</h2>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowModal(true)}
          className="gap-1.5 rounded-full border-gray-300 text-sm font-medium hover:bg-gray-50"
        >
          <Pencil className="size-3.5" />
          Write a Review
        </Button>
      </div>

      {/* ── Rating summary panel ── */}
      <div className="flex flex-col gap-4 border-t border-border px-6 py-5 sm:flex-row sm:items-center sm:gap-10">
        {/* Left: big score */}
        <div className="flex shrink-0 flex-col items-start gap-1">
          <span className="text-5xl font-extrabold tabular-nums leading-none text-gray-900">
            {summary.average.toFixed(1)}
          </span>
          <RatingStars rating={summary.average} showCount={false} size="md" />
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            {summary.count} reviews
            <BadgeCheck className="size-3.5 text-blue-500" />
          </span>
        </div>

        {/* Right: rating bars */}
        <div className="flex flex-1 flex-col gap-2 min-w-0">
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

      {/* ── Trust badges strip ── */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border bg-gray-50/70 px-6 py-3">
        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
          <ShieldCheck className="size-4 text-emerald-500" /> 100% Verified Purchases
        </span>
        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
          <Camera className="size-4 text-blue-500" /> Customer Photos
        </span>
        <span className="flex items-center gap-1.5 text-xs font-medium text-gray-600">
          <BadgeCheck className="size-4 text-amber-500" /> Authentic Feedback
        </span>
        {starFilter !== 0 && (
          <button
            type="button"
            onClick={() => changeStar(0)}
            className="ml-auto text-xs text-sky-600 underline underline-offset-2 hover:text-sky-800"
          >
            Clear filter ✕
          </button>
        )}
      </div>

      {/* ── Horizontal scrollable review cards ── */}
      <div className="relative border-t border-border px-6 py-5">
        {/* Left arrow */}
        <button
          type="button"
          onClick={() => scrollBy("left")}
          aria-label="Scroll left"
          className="absolute left-1 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-white p-1.5 shadow-md transition hover:bg-gray-50"
        >
          <ChevronLeft className="size-4" />
        </button>

        {/* Cards row */}
        {loading && reviews.length === 0 ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" />
          </div>
        ) : reviews.length === 0 ? (
          <p className="rounded-xl bg-muted p-6 text-center text-sm text-muted-foreground">
            No reviews match your filter.
          </p>
        ) : (
          <div
            ref={scrollRef}
            className="flex gap-4 overflow-x-auto scroll-smooth pb-2 px-6 scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} onHelpful={handleHelpful} />
            ))}

            {/* Load more sentinel card */}
            {hasMore && (
              <div className="flex w-40 shrink-0 items-center justify-center rounded-2xl border border-dashed border-border">
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
        )}

        {/* Right arrow */}
        <button
          type="button"
          onClick={() => scrollBy("right")}
          aria-label="Scroll right"
          className="absolute right-1 top-1/2 z-10 -translate-y-1/2 rounded-full border border-border bg-white p-1.5 shadow-md transition hover:bg-gray-50"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      {/* ── Write Review Modal ── */}
      {showModal && <WriteReviewModal productId={productId} onClose={() => setShowModal(false)} />}
    </div>
  );
}
