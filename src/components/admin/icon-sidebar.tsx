"use client";
import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Package, Layers, ShoppingCart, Users, BarChart3, Link2, Star,
  ImageIcon, Settings, Plus, Store, Globe, ShieldCheck, Truck, Shapes, PanelsTopLeft,
  Clapperboard, Menu, X, SearchCheck, MessageCircleQuestion,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const TOP_ICONS = [
  { icon: LayoutDashboard, href: "/admin", label: "Dashboard" },
  { icon: Package, href: "/admin/products", label: "Products" },
  { icon: Layers, href: "/admin/combos", label: "Combos" },
  { icon: Shapes, href: "/admin/categories", label: "Categories" },
  { icon: PanelsTopLeft, href: "/admin/homepage", label: "Homepage & banners" },
  { icon: Clapperboard, href: "/admin/instagram", label: "Instagram & reels" },
  { icon: ShoppingCart, href: "/admin/orders", label: "Orders" },
  { icon: Users, href: "/admin/customers", label: "Customers" },
  { icon: BarChart3, href: "/admin/analytics", label: "Analytics" },
  { icon: Link2, href: "/admin/links", label: "Tracked links" },
  { icon: Star, href: "/admin/reviews", label: "Reviews" },
  { icon: MessageCircleQuestion, href: "/admin/faq", label: "FAQ" },
  { icon: ImageIcon, href: "/admin/media", label: "Media" },
  { icon: Truck, href: "/admin/meesho", label: "Meesho sourcing" },
  { icon: SearchCheck, href: "/admin/seo", label: "SEO dashboard" },
];
const BOTTOM_ICONS = [
  { icon: Plus, href: "/admin/products/new", label: "Add product" },
  { icon: Globe, href: "/", label: "View store" },
  { icon: ShieldCheck, href: "/admin/settings/users", label: "Admin users" },
  { icon: Settings, href: "/admin/settings", label: "Settings" },
];

function isActive(href: string, pathname: string) {
  return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
}

function DesktopIconBtn({ icon: Icon, href, label, active = false }: { icon: React.ElementType; href: string; label: string; active?: boolean }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href={href} aria-label={label} aria-current={active ? "page" : undefined}
          className={cn("grid size-11 place-items-center rounded-2xl transition-all outline-none focus-visible:ring-2 focus-visible:ring-sky-900/60",
            active ? "glass-pill-active" : "glass-icon text-sky-950/75 hover:text-sky-950")}>
          <Icon className="size-5" strokeWidth={1.8} />
        </Link>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs">{label}</TooltipContent>
    </Tooltip>
  );
}

function MobileNavLink({ icon: Icon, href, label, active, onClick }: { icon: React.ElementType; href: string; label: string; active: boolean; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick}
      className={cn("flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
        active ? "glass-pill-active text-sky-800" : "text-sky-950/80 hover:bg-white/50 hover:text-sky-950")}>
      <Icon className="size-4.5 shrink-0" strokeWidth={1.8} />
      {label}
    </Link>
  );
}

export function AdminIconSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  // Close drawer when route changes
  React.useEffect(() => { setOpen(false); }, [pathname]);

  return (
    <>
      {/* ── Desktop sidebar (icon-only pill) ── */}
      <aside className="glass-clear relative z-10 m-3 mr-0 hidden w-16 shrink-0 flex-col items-center justify-between rounded-[28px] py-4 md:flex">
        <div className="flex flex-col items-center gap-4">
          <Link href="/admin" aria-label="MelaMart admin home" className="btn-glass grid size-9 place-items-center rounded-xl">
            <Store className="size-5" strokeWidth={2.2} />
          </Link>
          <div className="h-px w-8 bg-white/60" />
          <nav aria-label="Admin sections" className="flex flex-col items-center gap-1">
            {TOP_ICONS.map((item) => (
              <DesktopIconBtn key={item.href} {...item} active={isActive(item.href, pathname)} />
            ))}
          </nav>
        </div>
        <nav aria-label="Admin utilities" className="flex flex-col items-center gap-1">
          {BOTTOM_ICONS.map((item) => (
            <DesktopIconBtn key={item.label} {...item}
              active={item.href !== "/" && item.href !== "/admin/products/new" && isActive(item.href, pathname)} />
          ))}
        </nav>
      </aside>

      {/* ── Mobile: hamburger button in the header row ── */}
      <button
        type="button"
        aria-label="Open navigation menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="glass-icon absolute left-4 top-5 z-30 grid size-9 place-items-center rounded-2xl text-sky-950/75 hover:text-sky-950 md:hidden"
      >
        <Menu className="size-5" strokeWidth={1.8} />
      </button>

      {/* ── Mobile: full-screen overlay drawer ── */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal aria-label="Admin navigation">
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          {/* drawer */}
          <aside className="absolute inset-y-0 left-0 w-72 overflow-y-auto bg-sky-50 px-3 py-4 shadow-2xl">
            <div className="mb-4 flex items-center justify-between px-1">
              <Link href="/admin" onClick={() => setOpen(false)} className="flex items-center gap-2">
                <span className="btn-glass grid size-8 place-items-center rounded-xl">
                  <Store className="size-4" strokeWidth={2.2} />
                </span>
                <span className="font-serif text-base font-bold text-sky-950">
                  Mela<span className="text-amber-500">Mart</span>
                  <span className="ml-1.5 text-[10px] font-medium text-sky-700">Admin</span>
                </span>
              </Link>
              <button type="button" aria-label="Close menu" onClick={() => setOpen(false)}
                className="grid size-9 place-items-center rounded-xl text-sky-950/60 hover:bg-white/70">
                <X className="size-5" />
              </button>
            </div>
            <div className="h-px bg-sky-900/10 mb-2" />
            <nav aria-label="Admin sections" className="flex flex-col gap-0.5">
              {TOP_ICONS.map((item) => (
                <MobileNavLink key={item.href} {...item} active={isActive(item.href, pathname)} onClick={() => setOpen(false)} />
              ))}
            </nav>
            <div className="my-3 h-px bg-sky-900/10" />
            <nav aria-label="Admin utilities" className="flex flex-col gap-0.5">
              {BOTTOM_ICONS.map((item) => (
                <MobileNavLink key={item.label} {...item}
                  active={item.href !== "/" && item.href !== "/admin/products/new" && isActive(item.href, pathname)}
                  onClick={() => setOpen(false)} />
              ))}
            </nav>
          </aside>
        </div>
      )}
    </>
  );
}
