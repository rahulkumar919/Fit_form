"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, House, Layers, LayoutGrid, Package, Search, ShoppingBag, User, type LucideIcon } from "lucide-react";
import type { BottomNavItem } from "@/lib/validations/homepage";
import { useStore } from "@/lib/store/store-provider";
import { cn } from "@/lib/utils";

export const OPEN_SEARCH_EVENT = "ff:open-search";

export const BOTTOM_NAV_META: Record<BottomNavItem, { label: string; icon: LucideIcon; href?: string }> = {
  home: { label: "Home", icon: House, href: "/" },
  shop: { label: "Shop", icon: LayoutGrid, href: "/shop/all-products" },
  combos: { label: "Combos", icon: Layers, href: "/combos" },
  search: { label: "Search", icon: Search },
  wishlist: { label: "Wishlist", icon: Heart, href: "/wishlist" },
  bag: { label: "Bag", icon: ShoppingBag },
  account: { label: "Account", icon: User, href: "/account" },
  orders: { label: "Orders", icon: Package, href: "/orders" },
};

/** Pages with their own sticky action bar (buy / pay) don't show the bottom nav. */
const HIDDEN_ON = ["/product/", "/combo/", "/checkout"];

function isActive(item: BottomNavItem, pathname: string) {
  if (item === "home") return pathname === "/";
  if (item === "shop") return pathname.startsWith("/shop/");
  const href = BOTTOM_NAV_META[item].href;
  return !!href && pathname.startsWith(href);
}

/** App-style tab bar on phones. Configured in Admin → Homepage → Social & buttons. */
export function BottomNav({ items, preview = false }: { items: BottomNavItem[]; preview?: boolean }) {
  const pathname = usePathname();
  const { itemCount, wishlist, setCartOpen } = useStore();
  const hidden = !preview && HIDDEN_ON.some((p) => pathname.startsWith(p));

  // Reserve room at the bottom so the bar never covers page content or the footer.
  React.useEffect(() => {
    if (preview || hidden) return;
    document.body.classList.add("has-bottom-nav");
    return () => document.body.classList.remove("has-bottom-nav");
  }, [preview, hidden]);

  if (hidden || items.length === 0) return null;
  const current = preview ? "/" : pathname;

  return (
    <nav
      aria-label="Quick navigation"
      className={cn(
        "inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-lg",
        preview ? "absolute" : "fixed pb-[env(safe-area-inset-bottom)] shadow-[0_-6px_20px_-12px_rgba(0,0,0,0.18)] md:hidden",
      )}
    >
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((key) => {
          const m = BOTTOM_NAV_META[key];
          const active = isActive(key, current);
          const badge = key === "bag" ? itemCount : key === "wishlist" ? wishlist.length : 0;
          const inner = (
            <>
              <span className="relative">
                <m.icon className={cn("size-[22px]", active && key !== "wishlist" && "stroke-[2.4]", active && key === "wishlist" && "fill-current")} aria-hidden />
                {badge > 0 && (
                  <span className="absolute -right-2 -top-1.5 grid min-w-4 place-items-center rounded-full bg-sale px-1 text-[9px] font-bold leading-4 text-sale-foreground">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </span>
              <span className={cn("text-[10px] leading-none", active ? "font-semibold" : "font-medium")}>{m.label}</span>
            </>
          );
          const cls = cn(
            "flex h-14 w-full flex-col items-center justify-center gap-1 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
            active ? "text-foreground" : "text-muted-foreground",
          );
          const label = badge > 0 ? `${m.label}, ${badge} item${badge === 1 ? "" : "s"}` : m.label;
          return (
            <li key={key}>
              {m.href ? (
                <Link href={m.href} className={cls} aria-current={active ? "page" : undefined} aria-label={label}>{inner}</Link>
              ) : (
                <button type="button" className={cls} aria-label={label}
                  onClick={() => {
                    if (preview) return;
                    if (key === "bag") setCartOpen(true);
                    else window.dispatchEvent(new Event(OPEN_SEARCH_EVENT));
                  }}>
                  {inner}
                </button>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
