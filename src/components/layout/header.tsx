"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, Heart, ShoppingBag, User, ChevronDown, X } from "lucide-react";
import {
  Sheet, SheetContent, SheetTrigger, SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useStore } from "@/lib/store/store-provider";
import { categoryHref, isSystemCategory } from "@/lib/catalog-constants";
import { MelaLogo } from "@/components/icons/logo";
import { SearchDialog } from "./search-dialog";
import { cn } from "@/lib/utils";

export interface NavCategory { name: string; slug: string }

/** How many product categories fit in the desktop bar; the rest go under "More". */
const BAR_LIMIT = 6;

export function Header({ categories }: { categories: NavCategory[] }) {
  const { itemCount, wishlist, setCartOpen } = useStore();
  const [searchOpen, setSearchOpen] = React.useState(false);
  // The phone bottom bar's Search button opens this same dialog.
  React.useEffect(() => {
    const open = () => setSearchOpen(true);
    window.addEventListener("ff:open-search", open);
    return () => window.removeEventListener("ff:open-search", open);
  }, []);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const pathname = usePathname();

  // Admin order is preserved. Product categories fill the bar; built-in collections and overflow go in "More".
  const productCats = categories.filter((c) => !isSystemCategory(c.slug));
  const bar = productCats.slice(0, BAR_LIMIT).map((c) => ({ label: c.name, href: categoryHref(c.slug) }));
  const NAV = [{ label: "Combos", href: "/combos" }, ...bar];
  const more = [
    ...productCats.slice(BAR_LIMIT),
    ...categories.filter((c) => isSystemCategory(c.slug) && c.slug !== "combos" && c.slug !== "all-products"),
  ];
  const categoryGroups = categories.filter((c) => c.slug !== "all-products" && c.slug !== "combos");

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-lg">
        <div className="container-store flex h-16 items-center gap-3">
          {/* mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="md:hidden" aria-label="Open menu">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <div className="flex items-center justify-between border-b border-border p-5">
                <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 shrink-0" aria-label="MelaMart home">
                  <MelaLogo className="h-14 w-auto" />
                </Link>
                <SheetClose asChild><button aria-label="Close" className="text-muted-foreground"><X /></button></SheetClose>
              </div>
              <nav className="flex flex-col p-3">
                <Link href="/" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted">Home</Link>
                <Link href="/combos" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted">Combos</Link>
                {categoryGroups.map((c) => (
                  <Link key={c.slug} href={categoryHref(c.slug)} onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted">
                    {c.name}
                  </Link>
                ))}
                <div className="my-2 h-px bg-border" />
                <Link href="/account" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted">My Account</Link>
                <Link href="/wishlist" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted">Wishlist</Link>
                <Link href="/orders" onClick={() => setMobileOpen(false)} className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-muted">Orders</Link>
              </nav>
            </SheetContent>
          </Sheet>

          {/* logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0" aria-label="MelaMart home">
            <MelaLogo className="h-12 w-auto" />
          </Link>

          {/* desktop nav */}
          <nav className="ml-4 hidden items-center gap-0.5 md:flex lg:ml-6 lg:gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-2 py-1.5 text-xs font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground lg:px-3 lg:py-2 lg:text-sm",
                  pathname === item.href && "bg-muted text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-0.5 rounded-lg px-3 py-2 text-sm font-medium text-foreground/80 transition-colors hover:bg-muted hover:text-foreground">
                  More <ChevronDown className="size-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start">
                <DropdownMenuLabel>Shop by category</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {more.map((c) => (
                  <DropdownMenuItem key={c.slug} asChild>
                    <Link href={categoryHref(c.slug)}>{c.name}</Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuItem asChild><Link href="/shop/all-products">All products</Link></DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link href="/combos">Complete Combos</Link></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" onClick={() => setSearchOpen(true)} aria-label="Search">
              <Search />
            </Button>
            <Button asChild variant="ghost" size="icon-sm" aria-label="Account">
              <Link href="/account"><User /></Link>
            </Button>
            <Button asChild variant="ghost" size="icon-sm" className="relative" aria-label="Wishlist">
              <Link href="/wishlist">
                <Heart />
                {wishlist.length > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-sale text-[9px] font-bold text-sale-foreground">
                    {wishlist.length}
                  </span>
                )}
              </Link>
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => setCartOpen(true)} className="relative" aria-label="Cart">
              <ShoppingBag />
              {itemCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-foreground text-[9px] font-bold text-background">
                  {itemCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </header>
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
    </>
  );
}
