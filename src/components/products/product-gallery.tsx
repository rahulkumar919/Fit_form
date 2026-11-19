"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Product / combo gallery.
 *  - Phones: swipeable full-width images (scroll-snap) with a 1/N counter and dots.
 *  - Desktop: vertical thumbnails on the left, one main image capped in height so it never dominates the page.
 */
export function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  // Selection is tied to the image set it was made for, so switching colour resets to the first view.
  const [sel, setSel] = React.useState({ images, index: 0 });
  const active = sel.images === images && sel.index < images.length ? sel.index : 0;
  const setActive = (index: number) => setSel({ images, index });
  const trackRef = React.useRef<HTMLDivElement>(null);

  if (images.length === 0) return null;

  const onScroll = () => {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== active) setActive(i);
  };
  const goTo = (i: number) => {
    setActive(i);
    const el = trackRef.current;
    if (el) el.scrollTo({ left: i * el.clientWidth, behavior: "smooth" });
  };

  return (
    <div className="lg:grid lg:grid-cols-[64px_minmax(0,1fr)] lg:gap-3">
      {/* desktop thumbnails */}
      {images.length > 1 && (
        <div className="no-scrollbar hidden max-h-[600px] flex-col gap-2 overflow-y-auto lg:flex" role="tablist" aria-label="Product images">
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={active === i}
              aria-label={`Show image ${i + 1}`}
              onClick={() => setActive(i)}
              onMouseEnter={() => setActive(i)}
              className={cn(
                "relative aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-lg bg-muted ring-2 ring-offset-1 transition focus-visible:outline-none",
                active === i ? "ring-foreground" : "ring-transparent opacity-70 hover:opacity-100",
              )}
            >
              <Image src={src} alt="" fill sizes="64px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* desktop main image */}
      <div className={cn("relative hidden aspect-[4/5] max-h-[600px] w-full overflow-hidden rounded-2xl bg-muted lg:block", images.length < 2 && "lg:col-span-2")}>
        <Image
          key={images[active]}
          src={images[active]}
          alt={`${alt}, view ${active + 1}`}
          fill
          preload={active === 0}
          sizes="(min-width: 1280px) 520px, 42vw"
          className="object-cover"
        />
      </div>

      {/* phone: swipe */}
      <div className="relative -mx-4 sm:mx-0 lg:hidden">
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto sm:rounded-2xl"
          aria-label={`${alt} images`}
        >
          {images.map((src, i) => (
            <div key={i} className="relative aspect-[4/5] max-h-[62vh] w-full shrink-0 snap-center bg-muted sm:max-h-[70vh]">
              <Image
                src={src}
                alt={`${alt}, view ${i + 1}`}
                fill
                preload={i === 0}
                loading={i === 0 ? undefined : "lazy"}
                sizes="(min-width: 640px) 80vw, 100vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
        {images.length > 1 && (
          <>
            <span className="absolute right-3 top-3 rounded-full bg-black/55 px-2 py-0.5 text-[11px] font-medium text-white tabular-nums">
              {active + 1}/{images.length}
            </span>
            <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Show image ${i + 1}`}
                  aria-current={active === i ? "true" : undefined}
                  className={cn("h-1.5 rounded-full transition-all", active === i ? "w-4 bg-white" : "w-1.5 bg-white/60")}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
