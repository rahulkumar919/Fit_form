"use client";

import * as React from "react";
import { useSession } from "next-auth/react";
import type { CartItem, Coupon } from "@/types";
import { COUPONS } from "@/lib/data/store";
import { uid } from "@/lib/utils";
import { track } from "@/components/tracking/tracker";

interface StoreState {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  updateQty: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  appliedCoupon: Coupon | null;
  applyCoupon: (code: string) => Promise<{ ok: boolean; message: string }>;
  removeCoupon: () => void;
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  itemCount: number;
  freeShipThreshold: number;
  cartOpen: boolean;
  setCartOpen: (open: boolean) => void;
  wishlist: string[];
  toggleWishlist: (id: string, kind?: "product" | "combo") => void;
  isWishlisted: (id: string) => boolean;
}

const StoreContext = React.createContext<StoreState | null>(null);

const CART_KEY   = "melamart:cart";
const WISH_KEY   = "melamart:wishlist";
const COUPON_KEY = "melamart:coupon";


export function StoreProvider({
  children,
  shippingRules = { threshold: 1999, flat: 49 },
}: {
  children: React.ReactNode;
  shippingRules?: { threshold: number; flat: number };
}) {
  const FREE_SHIP = shippingRules.threshold;
  const FLAT_SHIP = shippingRules.flat;
  const [items, setItems]               = React.useState<CartItem[]>([]);
  const [wishlist, setWishlist]         = React.useState<string[]>([]);
  const [cartOpen, setCartOpen]         = React.useState(false);
  const [appliedCoupon, setAppliedCoupon] = React.useState<Coupon | null>(null);
  const [serverDiscount, setServerDiscount] = React.useState<number | null>(null);
  const [hydrated, setHydrated]         = React.useState(false);
  const { data: session, status } = useSession();
  const isCustomer = status === "authenticated" && session?.user?.role === "customer";
  const userId = session?.user?.userId;
  const wishlistRef = React.useRef<string[]>([]);
  const syncedFor = React.useRef<string | null>(null);

  /* ── Hydrate from localStorage ── */
  // localStorage is unavailable during SSR, so the first client render must match the server (empty)
  // and the saved cart is loaded right after mount. This is the documented exception for external stores.
  React.useEffect(() => {
    try {
      const cart = JSON.parse(localStorage.getItem(CART_KEY) ?? "[]");
      const wish = JSON.parse(localStorage.getItem(WISH_KEY) ?? "[]");
      const code = localStorage.getItem(COUPON_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage
      setItems(Array.isArray(cart) ? cart : []);
      setWishlist(Array.isArray(wish) ? wish : []);
      if (code) {
        const c = COUPONS.find((x) => x.code === code) ?? null;
        setAppliedCoupon(c);
      }
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  /* ── Persist ── */
  React.useEffect(() => { if (hydrated) localStorage.setItem(CART_KEY, JSON.stringify(items)); }, [items, hydrated]);
  React.useEffect(() => { if (hydrated) localStorage.setItem(WISH_KEY, JSON.stringify(wishlist)); }, [wishlist, hydrated]);
  React.useEffect(() => {
    if (!hydrated) return;
    if (appliedCoupon) localStorage.setItem(COUPON_KEY, appliedCoupon.code);
    else localStorage.removeItem(COUPON_KEY);
  }, [appliedCoupon, hydrated]);

  React.useEffect(() => {
    wishlistRef.current = wishlist;
  }, [wishlist]);

  /* ── Fold the guest wishlist into the account once per login ── */
  React.useEffect(() => {
    if (!hydrated || !isCustomer || !userId || syncedFor.current === userId) return;
    syncedFor.current = userId;
    (async () => {
      try {
        const res = await fetch("/api/user/wishlist", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: wishlistRef.current.slice(0, 200) }),
        });
        const json = await res.json();
        if (json.success) setWishlist([...json.data.productIds, ...json.data.comboIds]);
      } catch {
        /* offline: keep the local list; it will sync next session */
      }
    })();
  }, [hydrated, isCustomer, userId]);

  React.useEffect(() => {
    if (status === "unauthenticated") syncedFor.current = null;
  }, [status]);

  /* ── Cart actions ── */
  const addItem = React.useCallback((item: Omit<CartItem, "id">) => {
    track("add_to_cart", { refId: item.refId, value: item.unitPrice * item.quantity });
    setItems((prev) => {
      if (item.kind === "product") {
        const idx = prev.findIndex(
          (p) => p.kind === "product" && p.refId === item.refId && p.size === item.size && p.color === item.color,
        );
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], quantity: next[idx].quantity + item.quantity };
          return next;
        }
      }
      return [...prev, { ...item, id: uid("ci") }];
    });
    setCartOpen(true);
  }, []);

  const updateQty = React.useCallback((id: string, qty: number) => {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, quantity: Math.max(0, qty) } : p)).filter((p) => p.quantity > 0));
  }, []);

  const removeItem = React.useCallback((id: string) => {
    setItems((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const clearCart = React.useCallback(() => {
    setItems([]);
    setAppliedCoupon(null);
    setServerDiscount(null);
  }, []);

  /* ── Derived totals ── */
  const subtotal = React.useMemo(
    () => items.reduce((sum, p) => sum + p.unitPrice * p.quantity, 0),
    [items],
  );

  const discount = React.useMemo(() => {
    // Prefer server-calculated discount when available
    if (serverDiscount !== null) return serverDiscount;
    if (!appliedCoupon || subtotal < appliedCoupon.minSubtotal) return 0;
    if (appliedCoupon.type === "flat") return Math.min(appliedCoupon.value, subtotal);
    const d = Math.round((subtotal * appliedCoupon.value) / 100);
    return appliedCoupon.maxDiscount ? Math.min(d, appliedCoupon.maxDiscount) : d;
  }, [appliedCoupon, subtotal, serverDiscount]);

  const shipping = React.useMemo(() => {
    if (subtotal === 0) return 0;
    return subtotal - discount >= FREE_SHIP ? 0 : FLAT_SHIP;
  }, [subtotal, discount, FREE_SHIP, FLAT_SHIP]);

  const total     = Math.max(0, subtotal - discount + shipping);
  const itemCount = items.reduce((n, p) => n + p.quantity, 0);

  /* ── Coupon (async — validates against API) ── */
  const applyCoupon = React.useCallback(async (code: string) => {
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        return { ok: false, message: data.message ?? "Invalid coupon code." };
      }
      // Store synthetic coupon for UI display
      setAppliedCoupon({
        code: data.data.code,
        description: data.data.description,
        type: data.data.type as "percentage" | "flat",
        value: 0,
        minSubtotal: 0,
      });
      setServerDiscount(data.data.discount);
      return { ok: true, message: `Coupon ${data.data.code} applied!` };
    } catch {
      // Fallback to local mock
      const c = COUPONS.find((x) => x.code.toUpperCase() === code.toUpperCase());
      if (!c) return { ok: false, message: "Invalid coupon code." };
      if (subtotal < c.minSubtotal) return { ok: false, message: `Minimum order ₹${c.minSubtotal} required.` };
      setAppliedCoupon(c);
      return { ok: true, message: `Coupon ${c.code} applied!` };
    }
  }, [subtotal]);

  const removeCoupon = React.useCallback(() => {
    setAppliedCoupon(null);
    setServerDiscount(null);
  }, []);

  /* ── Wishlist ── */
  const toggleWishlist = React.useCallback(
    (id: string, kind: "product" | "combo" = "product") => {
      const adding = !wishlistRef.current.includes(id);
      setWishlist((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
      if (isCustomer) {
        // Explicit add/remove keeps the server idempotent even if state drifted.
        fetch("/api/user/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind, id, add: adding }),
        }).catch(() => undefined);
      }
    },
    [isCustomer],
  );
  const isWishlisted = React.useCallback((id: string) => wishlist.includes(id), [wishlist]);

  const value: StoreState = {
    items, addItem, updateQty, removeItem, clearCart,
    appliedCoupon, applyCoupon, removeCoupon,
    subtotal, discount, shipping, total, itemCount, freeShipThreshold: FREE_SHIP,
    cartOpen, setCartOpen,
    wishlist, toggleWishlist, isWishlisted,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = React.useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within <StoreProvider>");
  return ctx;
}

export function useCart() { return useStore(); }
export function useWishlist() { return useStore(); }
