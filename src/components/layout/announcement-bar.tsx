"use client";
import * as React from "react";
import { Sparkles, Truck, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Announcement { icon: "truck" | "tag" | "sparkles"; text: string }
const ICONS = { truck: Truck, tag: Tag, sparkles: Sparkles };

/** One line at a time, rotating every 5s (paused on hover/focus or when reduced motion is on). */
export function AnnouncementBar({ messages }: { messages: Announcement[] }) {
  const [i, setI] = React.useState(0);
  const [paused, setPaused] = React.useState(false);

  React.useEffect(() => {
    if (messages.length < 2 || paused) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const t = window.setInterval(() => setI((n) => (n + 1) % messages.length), 5000);
    return () => window.clearInterval(t);
  }, [messages.length, paused]);

  if (messages.length === 0) return null;
  return (
    <div
      className="bg-foreground text-background"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="container-store relative flex h-9 items-center justify-center overflow-hidden text-xs sm:text-[13px]" aria-live="off">
        {messages.map((m, idx) => {
          const Icon = ICONS[m.icon];
          return (
            <p
              key={m.text}
              aria-hidden={idx !== i}
              className={cn(
                "absolute inset-x-4 flex items-center justify-center gap-1.5 truncate transition-all duration-500",
                idx === i ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-2 opacity-0",
              )}
            >
              <Icon className="size-3.5 shrink-0 opacity-80" aria-hidden />
              <span className="truncate">{m.text}</span>
            </p>
          );
        })}
      </div>
    </div>
  );
}
