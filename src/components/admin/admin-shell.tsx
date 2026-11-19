"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent,
  DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const TOP_NAV = [
  { label: "Home", href: "/admin" },
  { label: "Products", href: "/admin/products" },
  { label: "Combos", href: "/admin/combos" },
  { label: "Orders", href: "/admin/orders" },
  { label: "Analytics", href: "/admin/analytics" },
  { label: "Links", href: "/admin/links" },
];

export function AdminShell({
  children,
  adminName = "Admin",
  adminEmail = "",
}: {
  children: React.ReactNode;
  adminName?: string;
  adminEmail?: string;
}) {
  const pathname = usePathname();
  const initials = adminName.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "AD";

  return (
    <div className="relative z-10 flex min-w-0 flex-1 flex-col overflow-hidden">
      <header className="glass-clear mx-3 mt-3 flex h-14 shrink-0 items-center gap-2 rounded-full px-3 pl-16 md:pl-5">
        <Link href="/admin" className="mr-2 hidden font-serif text-base font-bold text-sky-950 sm:block">
          Mela<span className="text-amber-500">Mart</span>
        </Link>

        <nav aria-label="Primary" className="flex items-center gap-0.5 overflow-x-auto">
          {TOP_NAV.map((item) => {
            const active = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-8 items-center whitespace-nowrap rounded-full px-3 text-sm font-medium transition-all",
                  active ? "glass-pill-active" : "text-sky-950/70 hover:bg-white/40 hover:text-sky-950",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <div className="hidden items-center gap-2 rounded-full border border-white/70 bg-white/35 px-3 py-1.5 sm:flex">
            <Search className="size-3.5 text-sky-950/65" />
            <span className="text-xs text-sky-950/65">Search</span>
            <kbd className="ml-6 rounded bg-white/50 px-1 text-[10px] text-sky-950/65">⌘K</kbd>
          </div>

          <button
            aria-label="Notifications"
            className="relative grid size-8 place-items-center rounded-full text-sky-950/70 transition hover:bg-white/40 hover:text-sky-950"
          >
            <Bell className="size-4" />
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button aria-label="Account menu" className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-sky-900/60">
                <Avatar className="size-8 cursor-pointer">
                  <AvatarFallback className="btn-glass text-xs font-bold">{initials}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="glass-dialog">
              <DropdownMenuLabel className="normal-case tracking-normal">
                <span className="block text-sm font-semibold text-sky-950">{adminName}</span>
                <span className="block text-xs font-normal text-sky-950/70">{adminEmail}</span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => signOut({ callbackUrl: "/admin/login" })}>
                <LogOut className="size-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-3 pb-6 pt-5 sm:px-5">{children}</main>
    </div>
  );
}
