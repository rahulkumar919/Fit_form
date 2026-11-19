"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Play, ShoppingBag } from "lucide-react";
import type { SocialView } from "@/lib/homepage";
import type { ReelsSection } from "@/lib/validations/homepage";
import { instagramEmbedUrl } from "@/lib/instagram";
import { InstagramIcon } from "@/components/icons/instagram";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { formatINR } from "@/lib/utils";

type Config = Pick<ReelsSection, "enabled" | "title" | "subtitle" | "count" | "autoplay">;

const subscribeMotion = (cb: () => void) => {
  const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
};
function useReducedMotion() {
  return React.useSyncExternalStore(subscribeMotion, () => window.matchMedia("(prefers-reduced-motion: reduce)").matches, () => false);
}

export function ShopTheReel({
  posts, config, handle, preview = false,
}: { posts: SocialView[]; config: Config; handle: string; preview?: boolean }) {
  const [open, setOpen] = React.useState<SocialView | null>(null);
  const reduced = useReducedMotion();
  const shown = posts.filter((p) => p.showInReels).slice(0, config.count);
  if (!config.enabled || shown.length === 0) return null;
  const autoplay = config.autoplay && !reduced;

  return (
    <section aria-labelledby="home-reels" className="@container bg-neutral-950 py-10 text-white md:py-14">
      <div className="container-store">
        <div className="mb-5 flex items-end justify-between gap-4 @3xl:mb-7">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-amber-300">
              <InstagramIcon className="size-3.5" /> As seen on Instagram
            </p>
            <h2 id="home-reels" className="font-serif text-2xl font-bold tracking-tight @3xl:text-3xl">{config.title}</h2>
            {config.subtitle && <p className="mt-1 text-sm text-white/60">{config.subtitle}</p>}
          </div>
          {handle && (
            <a href={`https://www.instagram.com/${handle}/`} target="_blank" rel="noopener noreferrer"
              className="shrink-0 text-sm font-medium text-white/80 underline-offset-4 hover:text-white hover:underline">
              @{handle} <span aria-hidden>→</span>
            </a>
          )}
        </div>

        <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 @3xl:mx-0 @3xl:gap-4 @3xl:px-0">
          {shown.map((p) => (
            <li key={p.id} className="shrink-0 basis-[44%] snap-start @md:basis-[31%] @xl:basis-[23%] @3xl:basis-[calc(20%-0.8rem)]">
              <ReelCard post={p} autoplay={autoplay} onOpen={() => setOpen(p)} preview={preview} />
            </li>
          ))}
        </ul>
      </div>

      <ReelDialog post={open} onClose={() => setOpen(null)} preview={preview} />
    </section>
  );
}

function ReelCard({ post: p, autoplay, onOpen, preview }: { post: SocialView; autoplay: boolean; onOpen: () => void; preview: boolean }) {
  const ref = React.useRef<HTMLVideoElement>(null);

  // Play muted only while mostly on screen; pause otherwise (saves data and battery).
  React.useEffect(() => {
    const v = ref.current;
    if (!v || !autoplay) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && e.intersectionRatio >= 0.6) v.play().catch(() => undefined);
        else v.pause();
      },
      { threshold: [0, 0.6, 1] },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [autoplay]);

  const label = p.caption || (p.shop ? `Reel: ${p.shop.name}` : "Instagram reel");

  return (
    <div className="group relative aspect-[9/16] overflow-hidden rounded-2xl bg-neutral-800 ring-1 ring-white/10">
      {p.video ? (
        <video
          ref={ref}
          src={p.video}
          poster={p.image}
          muted
          loop
          playsInline
          preload="none"
          aria-hidden
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <Image src={p.image} alt="" fill sizes="(min-width: 1024px) 19vw, 44vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
      )}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/30" />

      {/* Whole card opens the player */}
      <button type="button" onClick={onOpen} aria-label={`Play ${label}`}
        className="absolute inset-0 z-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white" />

      <div className="pointer-events-none absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full bg-black/35 px-2 py-0.5 text-[11px] font-medium backdrop-blur">
        <Play className="size-3 fill-white" aria-hidden /> Reel
      </div>
      <a
        href={p.instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => preview && e.preventDefault()}
        aria-label="Open this reel on Instagram (new tab)"
        className="absolute right-2 top-2 z-10 grid size-8 place-items-center rounded-full bg-black/35 backdrop-blur transition hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
      >
        <InstagramIcon className="size-4" />
      </a>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 p-2.5">
        {p.caption && <p className="mb-2 line-clamp-2 text-xs font-medium text-white/90">{p.caption}</p>}
        {p.shop && (
          <Link
            href={p.shop.href}
            onClick={(e) => preview && e.preventDefault()}
            className="pointer-events-auto relative z-10 flex items-center gap-2 rounded-xl bg-white/95 p-1.5 pr-2 text-neutral-900 shadow-lg transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300"
          >
            {p.shop.image && (
              <span className="relative size-9 shrink-0 overflow-hidden rounded-lg bg-neutral-100">
                <Image src={p.shop.image} alt="" fill sizes="36px" className="object-cover" />
              </span>
            )}
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[11px] font-semibold">{p.shop.name}</span>
              <span className="block text-[11px] text-neutral-600">{formatINR(p.shop.price)}</span>
            </span>
            <ShoppingBag className="size-4 shrink-0" aria-hidden />
            <span className="sr-only">Shop this look</span>
          </Link>
        )}
      </div>
    </div>
  );
}

function ReelDialog({ post: p, onClose, preview }: { post: SocialView | null; onClose: () => void; preview: boolean }) {
  const embed = p && !p.video ? instagramEmbedUrl(p.instagramUrl) : null;
  return (
    <Dialog open={!!p} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-h-[94vh] max-w-3xl overflow-y-auto border-0 bg-neutral-950 p-0 text-white sm:rounded-2xl [&>button:last-child]:z-20 [&>button:last-child]:bg-black/60 [&>button:last-child]:text-white [&>button:last-child]:opacity-100 [&>button:last-child]:hover:bg-black/80">
        <DialogTitle className="sr-only">{p?.caption || "Instagram reel"}</DialogTitle>
        <DialogDescription className="sr-only">Watch the reel and shop the look</DialogDescription>
        {p && (
          <div className="grid md:grid-cols-[minmax(0,380px)_1fr]">
            <div className="relative bg-black">
              {p.video ? (
                <video src={p.video} poster={p.image} controls autoPlay playsInline className="aspect-[9/16] w-full bg-black object-contain" />
              ) : embed ? (
                <iframe
                  src={embed}
                  title="Instagram reel"
                  loading="lazy"
                  allowFullScreen
                  className="h-[min(80vh,680px)] w-full bg-white"
                />
              ) : (
                <div className="relative aspect-[9/16]"><Image src={p.image} alt="" fill sizes="380px" className="object-cover" /></div>
              )}
            </div>
            <div className="flex flex-col gap-4 p-5">
              {p.caption && <p className="text-base font-medium leading-snug">{p.caption}</p>}
              {p.shop ? (
                <div className="rounded-2xl bg-white p-3 text-neutral-900">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-neutral-500">Shop this look</p>
                  <div className="flex items-center gap-3">
                    {p.shop.image && (
                      <span className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-neutral-100">
                        <Image src={p.shop.image} alt="" fill sizes="64px" className="object-cover" />
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-semibold">{p.shop.name}</p>
                      <p className="text-sm text-neutral-600">{formatINR(p.shop.price)}{p.shop.type === "combo" ? " · complete look" : ""}</p>
                    </div>
                  </div>
                  <Link href={p.shop.href} onClick={(e) => (preview ? e.preventDefault() : onClose())}
                    className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-neutral-900 text-sm font-semibold text-white transition hover:bg-neutral-800">
                    {p.shop.type === "combo" ? "Shop the combo" : "Shop now"} <ArrowRight className="size-4" />
                  </Link>
                </div>
              ) : (
                <p className="text-sm text-white/60">Browse similar looks in the shop.</p>
              )}
              <a href={p.instagramUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => preview && e.preventDefault()}
                className="mt-auto inline-flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white">
                <InstagramIcon className="size-4" /> Watch on Instagram <span aria-hidden>↗</span>
              </a>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
