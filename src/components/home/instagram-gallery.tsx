import Image from "next/image";
import { Play } from "lucide-react";
import type { SocialView } from "@/lib/homepage";
import type { GallerySection } from "@/lib/validations/homepage";
import { InstagramIcon } from "@/components/icons/instagram";

type Config = Pick<GallerySection, "enabled" | "title" | "count">;

/** "Follow the looks": every tile opens its own Instagram post/reel. Hidden when nothing is added. */
export function InstagramGallery({ posts, config, handle }: { posts: SocialView[]; config: Config; handle: string }) {
  const shown = posts.filter((p) => p.showInGallery).slice(0, config.count);
  if (!config.enabled || shown.length === 0) return null;

  return (
    <section aria-labelledby="home-gallery" className="@container container-store py-10 md:py-14">
      <div className="mb-5 flex flex-col items-center gap-1 text-center">
        {handle && (
          <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            <InstagramIcon className="size-3.5" /> @{handle}
          </p>
        )}
        <h2 id="home-gallery" className="font-serif text-2xl font-bold tracking-tight @3xl:text-3xl">{config.title}</h2>
      </div>
      <ul className="grid grid-cols-3 gap-1.5 @xl:gap-2.5 @3xl:grid-cols-6">
        {shown.map((p) => (
          <li key={p.id}>
            <a
              href={p.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${p.caption || (p.kind === "reel" ? "Reel" : "Post")} on Instagram (new tab)`}
              className="group relative block aspect-square overflow-hidden rounded-lg bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Image src={p.image} alt="" fill sizes="(min-width: 1024px) 16vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
              {p.kind === "reel" && (
                <span aria-hidden className="absolute right-1.5 top-1.5 grid size-6 place-items-center rounded-full bg-black/40 text-white backdrop-blur">
                  <Play className="size-3 fill-white" />
                </span>
              )}
              <span aria-hidden className="absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-transparent to-transparent p-2 opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                <span className="flex items-center gap-1.5 text-xs font-medium text-white">
                  <InstagramIcon className="size-3.5" /> <span className="line-clamp-1">{p.caption || "View on Instagram"}</span>
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
      {handle && (
        <div className="mt-6 flex justify-center">
          <a
            href={`https://www.instagram.com/${handle}/`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center gap-2 rounded-full border border-border px-5 text-sm font-medium transition hover:bg-muted"
          >
            <InstagramIcon className="size-4" /> Follow @{handle}
          </a>
        </div>
      )}
    </section>
  );
}
