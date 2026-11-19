"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";

type TrackType = "page_view" | "product_view" | "combo_view" | "add_to_cart" | "begin_checkout";

/** Fire-and-forget analytics event. Safe to call anywhere on the client. */
export function track(type: TrackType, extra: { refId?: string; value?: number } = {}) {
  if (typeof window === "undefined") return;
  const body = JSON.stringify({
    type,
    path: window.location.pathname,
    search: window.location.search,
    referrer: document.referrer,
    refId: extra.refId ?? "",
    value: extra.value ?? 0,
  });
  try {
    fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true, credentials: "same-origin" }).catch(() => undefined);
  } catch {
    /* tracking must never break the page */
  }
}

function TrackerInner() {
  const pathname = usePathname();
  const search = useSearchParams();
  const qs = search.toString();

  React.useEffect(() => {
    track("page_view");
    // drop our internal link param from the address bar once it has been recorded
    if (search.has("fflink")) {
      const url = new URL(window.location.href);
      url.searchParams.delete("fflink");
      window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, qs]);

  return null;
}

/** Sends a page_view on every client navigation. Mounted once in the store layout. */
export function Tracker() {
  return (
    <React.Suspense fallback={null}>
      <TrackerInner />
    </React.Suspense>
  );
}

/** Drop into a page to record a product/combo view once. */
export function TrackView({ type, refId, value }: { type: "product_view" | "combo_view"; refId: string; value?: number }) {
  React.useEffect(() => {
    track(type, { refId, value });
  }, [type, refId, value]);
  return null;
}
