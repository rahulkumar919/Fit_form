import Link from "next/link";
import { BadgeCheck, Quote, Star } from "lucide-react";

export interface HomeReview {
  id: string;
  author: string;
  rating: number;
  text: string;
  productName: string;
  productSlug: string;
}

/** Latest approved, verified-buyer reviews. Renders nothing until real reviews exist. */
export function CustomerReviews({ reviews, eyebrow = "From verified buyers", title = "What customers say" }: { reviews: HomeReview[]; eyebrow?: string; title?: string }) {
  if (reviews.length === 0) return null;
  return (
    <section className="container-store py-14 md:py-20">
      <div className="mb-8 text-center">
        {eyebrow && <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">{eyebrow}</p>}
        <h2 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">{title}</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((r) => (
          <figure key={r.id} className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
            <Quote className="size-6 text-sale/30" aria-hidden />
            <blockquote className="mt-3 line-clamp-5 flex-1 text-sm leading-relaxed text-foreground/90">“{r.text}”</blockquote>
            <figcaption className="mt-5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{r.author}</p>
                <p className="flex items-center gap-1 text-xs text-emerald-700">
                  <BadgeCheck className="size-3.5" /> Verified buyer
                </p>
                {r.productSlug && (
                  <Link href={`/product/${r.productSlug}`} className="mt-0.5 block truncate text-xs text-muted-foreground hover:underline">
                    {r.productName}
                  </Link>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-0.5" aria-label={`${r.rating} out of 5 stars`}>
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className={s < r.rating ? "size-3.5 fill-amber-400 text-amber-400" : "size-3.5 text-muted-foreground/30"} />
                ))}
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
