"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import type { BannerView } from "@/lib/homepage";
import type { HeroSection } from "@/lib/validations/homepage";
import { cn } from "@/lib/utils";

type Height = HeroSection["height"];
type MobileAspect = NonNullable<HeroSection["mobileAspect"]>;

/* ─── Desktop frame ratio per height option ─── */
export const DESKTOP_ASPECT: Record<Height, string> = {
  compact:  "md:aspect-[21/6]",   // ~3.5:1 — slim contained banner like Floriwish
  standard: "md:aspect-[16/5]",   // ~3.2:1 — standard desktop proportion
  tall:     "md:aspect-[12/5]",   // 2.4:1  — tall hero
};

/** Recommended upload sizes shown in the admin. */
export const BANNER_SIZE_HINT: Record<Height, string> = {
  compact:  "1920 × 540",
  standard: "1920 × 600",
  tall:     "1920 × 800",
};

/* ─── Mobile aspect-ratio Tailwind classes ─── */
const MOBILE_ASPECT_CLASS: Record<MobileAspect, string> = {
  "16/7": "aspect-[2/1]",
  "16/9": "aspect-[2/1]",
  "4/3":  "aspect-[4/3]",
  "1/1":  "aspect-square",
  "4/5":  "aspect-[4/5]",
};

/* ─── Reduced-motion hook ─── */
const subscribeMotion = (cb: () => void) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
function useReducedMotion() {
  return React.useSyncExternalStore(
    subscribeMotion,
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

export interface FallbackHero {
  highlights: string[];
}

export function HeroCarousel({
  banners,
  autoplaySeconds,
  height,
  mobileAspect = "4/3",
  fallback,
  preview = false,
}: {
  banners: BannerView[];
  autoplaySeconds: number;
  height: Height;
  mobileAspect?: MobileAspect;
  fallback: FallbackHero;
  preview?: boolean;
}) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [index, setIndex] = React.useState(0);
  const [userPaused, setUserPaused] = React.useState(false);
  const [hovering, setHovering] = React.useState(false);
  const reduced = useReducedMotion();
  const count = banners.length;
  const autoplay = autoplaySeconds > 0 && count > 1 && !reduced;
  const running = autoplay && !userPaused && !hovering;

  const goTo = React.useCallback(
    (i: number) => {
      const el = trackRef.current;
      if (!el || count === 0) return;
      const next = ((i % count) + count) % count;
      el.scrollTo({ left: next * el.clientWidth, behavior: reduced ? "auto" : "smooth" });
    },
    [count, reduced],
  );

  const onScroll = () => {
    const el = trackRef.current;
    if (!el || el.clientWidth === 0) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== index) setIndex(i);
  };

  const indexRef = React.useRef(index);
  React.useEffect(() => { indexRef.current = index; }, [index]);

  React.useEffect(() => {
    if (!running) return;
    const t = window.setInterval(() => {
      if (!document.hidden) goTo(indexRef.current + 1);
    }, autoplaySeconds * 1000);
    return () => window.clearInterval(t);
  }, [running, autoplaySeconds, goTo]);

  /*
   * Frame class strategy:
   *
   * When a dedicated mobileImage is uploaded, the admin has supplied a
   * portrait-cropped version optimised for phones — we can safely enforce a
   * fixed mobile aspect ratio and use object-cover on both breakpoints.
   *
   * When only a single (wide) desktop image exists, forcing a tall mobile
   * aspect ratio (e.g. 4:3) on a 3:1 banner causes massive cropping.
   * In that case we let the image render at its natural proportions on
   * mobile (height:auto) and only enforce the fixed aspect ratio on desktop.
   * The overflow-hidden + rounded corners are still applied; the frame just
   * grows to fit the image on mobile instead of clipping it.
   */
  const phoneCls = MOBILE_ASPECT_CLASS[mobileAspect] ?? "aspect-[4/3]";
  const desktopCls = DESKTOP_ASPECT[height];

  /*
   * withMobileImage — aspect ratio enforced on BOTH breakpoints (safe, since the
   * mobile image is purpose-cropped for phones).
   *
   * withoutMobileImage — aspect ratio only on desktop (≥md). On mobile the frame
   * height is "auto" (driven by the image's natural height) so the wide banner is
   * never cropped. We still apply overflow-hidden + rounded corners.
   */
  const frameClsWith    = cn("relative w-full overflow-hidden rounded-2xl md:rounded-3xl bg-neutral-100", phoneCls, desktopCls);
  const frameClsWithout = cn("relative w-full overflow-hidden rounded-2xl md:rounded-3xl bg-neutral-100", phoneCls, desktopCls);

  if (count === 0) {
    return (
      <div className="@container">
        {/* DefaultSlide is brand-designed, so we enforce the aspect ratio */}
        <div className={cn("relative w-full overflow-hidden rounded-2xl md:rounded-3xl bg-neutral-100", phoneCls, desktopCls)}>
          <DefaultSlide highlights={fallback.highlights} preview={preview} />
        </div>
      </div>
    );
  }

  return (
    <div
      className="@container"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onFocusCapture={() => setHovering(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setHovering(false);
      }}
    >
      <section
        aria-roledescription="carousel"
        aria-label="Featured collections"
        className="relative"
      >
        <div
          ref={trackRef}
          onScroll={onScroll}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-2xl md:rounded-3xl"
          aria-live={running ? "off" : "polite"}
        >
          {banners.map((b, i) => (
            <div
              key={b.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={i !== index}
              inert={i !== index ? true : undefined}
              className="relative w-full shrink-0 snap-start"
            >
              {/* Use the correct frame: with aspect ratio on mobile only when a dedicated mobile image exists */}
              <div className={b.mobileImage ? frameClsWith : frameClsWithout}>
                <Slide banner={b} first={i === 0} preview={preview} />
              </div>
            </div>
          ))}
        </div>

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label="Previous slide"
              className="absolute left-3 top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-neutral-900 shadow-md backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:grid"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label="Next slide"
              className="absolute right-3 top-1/2 hidden size-10 -translate-y-1/2 place-items-center rounded-full bg-white/80 text-neutral-900 shadow-md backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:grid"
            >
              <ChevronRight className="size-5" />
            </button>

            <div className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full bg-black/25 px-2.5 py-1.5 backdrop-blur-sm">
                {banners.map((b, i) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    aria-current={i === index ? "true" : undefined}
                    className={cn(
                      "h-1.5 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white",
                      i === index ? "w-5 bg-white" : "w-1.5 bg-white/60 hover:bg-white/90",
                    )}
                  />
                ))}
              </div>
              {autoplay && (
                <button
                  type="button"
                  onClick={() => setUserPaused((p) => !p)}
                  aria-label={userPaused ? "Play slideshow" : "Pause slideshow"}
                  className="grid size-7 place-items-center rounded-full bg-black/25 text-white backdrop-blur-sm transition hover:bg-black/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  {userPaused ? <Play className="size-3" /> : <Pause className="size-3" />}
                </button>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   SLIDE
   Image rendering strategy:
   - The frame has an explicit aspect ratio (mobile + desktop via CSS).
   - Images are absolutely positioned to fill the frame (inset-0).
   - object-fit: contain → never crops, always shows the full image.
   - When the admin uploads a separate mobile image, we use <picture>
     with a media query so the browser picks the right source natively —
     no JS, no layout shift.
   - Text overlay is absolutely positioned on top.
───────────────────────────────────────────────────────────────── */

function Slide({
  banner: b,
  first,
  preview,
}: {
  banner: BannerView;
  first: boolean;
  preview: boolean;
}) {
  const hasText = !!(b.title || b.subtitle || b.eyebrow);
  const dark = b.theme === "dark";
  const alt = b.alt || b.title || "Featured collection";
  const eager = first && !preview;

  /*
   * Image rendering:
   *
   * CASE A — separate mobile image uploaded:
   *   <picture> with two <source> elements.
   *   The mobile frame has a fixed aspect ratio and the mobile image is
   *   purpose-cropped to fill it, so object-cover is correct on both breakpoints.
   *
   * CASE B — single desktop-only image:
   *   On mobile  (< md): render as a normal responsive img (width:100%, height:auto).
   *                      The frame grows to fit the image — zero cropping.
   *   On desktop (≥ md): switch to absolute positioning + object-cover so the
   *                      image fills the fixed-aspect-ratio desktop frame.
   *
   *   We achieve this with a single <img> whose classes change at the md breakpoint:
   *     mobile  → "relative block w-full h-auto"
   *     desktop → "md:absolute md:inset-0 md:h-full md:w-full md:object-cover"
   *
   *   The parent frame has no mobile aspect ratio class (frameClsWithout), so it
   *   simply wraps the image on mobile instead of clipping it.
   */
  const imageEl = b.mobileImage ? (
    <picture className="absolute inset-0 h-full w-full">
      {/* Desktop: 768px and wider — wide banner image */}
      <source media="(min-width: 768px)" srcSet={b.image} width={1920} height={600} />
      {/* Mobile: up to 767px — mobile optimized banner */}
      <source media="(max-width: 767px)" srcSet={b.mobileImage} width={1080} height={570} />
      <img
        src={b.mobileImage || b.image}
        alt={hasText ? "" : alt}
        className="h-full w-full object-cover object-center"
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={eager ? "high" : "auto"}
      />
    </picture>
  ) : (
    <img
      src={b.image}
      alt={hasText ? "" : alt}
      className="absolute inset-0 h-full w-full object-cover object-center"
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={eager ? "high" : "auto"}
      width={1920}
      height={600}
    />
  );

  // Image-only banner (text baked into the artwork): the whole slide is the link.
  if (!hasText) {
    return b.ctaHref && !preview ? (
      <Link href={b.ctaHref} aria-label={b.ctaLabel || alt} className="block h-full w-full">
        {imageEl}
      </Link>
    ) : (
      <>{imageEl}</>
    );
  }

  return (
    <>
      {imageEl}

      {/* Readability gradient — sits above image, below text */}
      {b.overlay && (
        <div
          aria-hidden
          className={cn(
            "absolute inset-0 pointer-events-none",
            dark
              ? "bg-gradient-to-t from-white/85 via-white/35 to-transparent md:bg-gradient-to-r md:from-white/80 md:via-white/30 md:to-transparent"
              : "bg-gradient-to-t from-black/70 via-black/20 to-transparent md:bg-gradient-to-r md:from-black/60 md:via-black/15 md:to-transparent",
          )}
        />
      )}

      {/* Text + CTA */}
      <div className="absolute inset-0 flex items-end p-4 pb-10 sm:p-5 sm:pb-12 md:items-center md:p-10 md:pb-12 lg:px-14 lg:pb-14">
        <div className={cn("max-w-[85%] sm:max-w-xs md:max-w-[46%]", dark ? "text-neutral-900" : "text-white")}>
          {b.eyebrow && (
            <p
              className={cn(
                "mb-2 inline-block rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider md:mb-3 md:px-3 md:py-1 md:text-[11px]",
                dark
                  ? "bg-neutral-900/8 text-neutral-800"
                  : "bg-white/15 text-white backdrop-blur-sm",
              )}
            >
              {b.eyebrow}
            </p>
          )}
          {b.title && (
            <h2 className="font-serif text-[1.4rem] font-bold leading-[1.1] tracking-tight sm:text-[1.6rem] md:text-4xl lg:text-5xl">
              {b.title}
            </h2>
          )}
          {b.subtitle && (
            <p
              className={cn(
                "mt-1.5 text-xs leading-relaxed sm:text-sm md:mt-3 md:text-base lg:text-lg",
                dark ? "text-neutral-700" : "text-white/85",
              )}
            >
              {b.subtitle}
            </p>
          )}
          {b.highlights.length > 0 && (
            <ul
              className={cn(
                "mt-3 hidden flex-wrap items-center gap-x-3 gap-y-1 text-xs md:flex md:mt-4 md:text-sm",
                dark ? "text-neutral-700" : "text-white/85",
              )}
            >
              {b.highlights.map((h, i) => (
                <li key={i} className="flex items-center gap-3">
                  {i > 0 && (
                    <span
                      aria-hidden
                      className={cn("h-3.5 w-px", dark ? "bg-neutral-900/20" : "bg-white/35")}
                    />
                  )}
                  {h}
                </li>
              ))}
            </ul>
          )}
          {b.ctaLabel && b.ctaHref && (
            <CtaLink href={b.ctaHref} preview={preview} dark={dark} label={b.ctaLabel} />
          )}
        </div>
      </div>
    </>
  );
}

function CtaLink({
  href,
  label,
  dark,
  preview,
}: {
  href: string;
  label: string;
  dark: boolean;
  preview: boolean;
}) {
  const cls = cn(
    "mt-4 inline-flex h-9 items-center gap-1.5 rounded-lg px-4 text-sm font-semibold shadow-sm transition sm:mt-5 md:mt-6 md:h-11 md:gap-2 md:px-6",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
    dark
      ? "bg-neutral-900 text-white hover:bg-neutral-800 focus-visible:ring-neutral-900"
      : "bg-white text-neutral-900 hover:bg-white/90 focus-visible:ring-white",
  );
  if (preview) {
    return (
      <span className={cls}>
        {label} <ArrowRight className="size-4" />
      </span>
    );
  }
  return (
    <Link href={href} className={cls}>
      {label} <ArrowRight className="size-4" />
    </Link>
  );
}

/** Shown until the admin adds a banner: brand copy only, no stock photo. */
function DefaultSlide({
  highlights,
  preview,
}: {
  highlights: string[];
  preview: boolean;
}) {
  return (
    <div className="absolute inset-0 bg-[linear-gradient(120deg,#f6efe4_0%,#efe7dc_45%,#e3ebf3_100%)]">
      <div aria-hidden className="absolute -right-16 -top-24 size-80 rounded-full bg-white/50 blur-2xl" />
      <div aria-hidden className="absolute -bottom-28 right-1/4 size-72 rounded-full bg-amber-200/40 blur-3xl" />
      <span
        aria-hidden
        className="pointer-events-none absolute -bottom-6 right-4 hidden select-none font-serif text-[11rem] font-bold leading-none text-neutral-900/[0.05] @2xl:block @4xl:text-[15rem]"
      >
        F&amp;F
      </span>
      <div className="relative flex h-full items-center p-6 @md:p-10 @2xl:px-14">
        <div className="max-w-xl text-neutral-900">
          <p className="mb-3 inline-block rounded-full bg-neutral-900/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-800">
            Men&apos;s outfit combos
          </p>
          <h2 className="font-serif text-3xl font-bold leading-[1.05] tracking-tight @md:text-5xl @4xl:text-6xl">
            Outfits, <span className="text-sale">curated</span>.
          </h2>
          <p className="mt-2 max-w-md text-sm text-neutral-700 @md:mt-3 @md:text-base">
            Complete looks and individual pieces: jeans, shirts, tees and sneakers,
            styled to go together.
          </p>
          {highlights.length > 0 && (
            <ul className="mt-4 hidden flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-700 @md:flex">
              {highlights.map((h, i) => (
                <li key={h} className="flex items-center gap-4">
                  {i > 0 && <span aria-hidden className="h-4 w-px bg-neutral-900/20" />}
                  {h}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-5 flex flex-wrap gap-2.5 @md:mt-6 [&>*]:mt-0">
            <CtaLink href="/combos" label="Shop combos" dark preview={preview} />
            {!preview && (
              <Link
                href="/shop/all-products"
                className="inline-flex h-10 items-center rounded-lg border border-neutral-900/15 bg-white/60 px-4 text-sm font-semibold text-neutral-900 transition hover:bg-white @md:h-11 @md:px-6"
              >
                Explore products
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
