"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag, Tag, X } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/store/store-provider";
import { formatINR } from "@/lib/utils";
import { toast } from "sonner";

export function CartDrawer() {
  const {
    items, cartOpen, setCartOpen, updateQty, removeItem,
    subtotal, discount, shipping, total, itemCount,
    appliedCoupon, applyCoupon, removeCoupon, clearCart, freeShipThreshold,
  } = useStore();

  const FREE_SHIP = freeShipThreshold;
  const remaining = Math.max(0, FREE_SHIP - (subtotal - discount));
  const progress = Math.min(100, ((subtotal - discount) / FREE_SHIP) * 100);

  const handleApply = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const code = String(data.get("coupon") ?? "").trim();
    if (!code) return;
    const res = await applyCoupon(code);
    if (res.ok) toast.success(res.message);
    else toast.error(res.message);
    (e.currentTarget as HTMLFormElement).reset();
  };

  return (
    <Sheet open={cartOpen} onOpenChange={setCartOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md p-0">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingBag className="size-5" /> Your Bag
            {itemCount > 0 && <Badge variant="secondary">{itemCount}</Badge>}
          </SheetTitle>
          <SheetDescription className="sr-only">Shopping cart items</SheetDescription>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
            <div className="grid size-16 place-items-center rounded-full bg-muted">
              <ShoppingBag className="size-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium text-foreground">Your bag is empty</p>
              <p className="text-sm text-muted-foreground">Add some fits to get started.</p>
            </div>
            <Button asChild onClick={() => setCartOpen(false)}>
              <Link href="/shop/all-products">Browse products</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* free shipping bar */}
            <div className="border-b border-border px-5 py-3">
              {remaining > 0 ? (
                <p className="text-xs text-muted-foreground">
                  Add <span className="font-semibold text-foreground">{formatINR(remaining)}</span> more for free shipping
                </p>
              ) : (
                <p className="text-xs font-medium text-emerald-600">You unlocked free shipping</p>
              )}
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                <div className="h-full rounded-full bg-foreground transition-all" style={{ width: `${progress}%` }} />
              </div>
            </div>

            {/* items */}
            <div className="flex-1 overflow-y-auto px-5 py-4">
              <div className="flex flex-col gap-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <Link
                      href={item.kind === "combo" ? `/combo/${item.slug}` : `/product/${item.slug}`}
                      onClick={() => setCartOpen(false)}
                      className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-muted"
                    >
                      <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                    </Link>
                    <div className="flex flex-1 flex-col">
                      <div className="flex justify-between gap-2">
                        <Link
                          href={item.kind === "combo" ? `/combo/${item.slug}` : `/product/${item.slug}`}
                          onClick={() => setCartOpen(false)}
                          className="line-clamp-1 text-sm font-medium text-foreground hover:underline"
                        >
                          {item.name}
                        </Link>
                        <button onClick={() => removeItem(item.id)} className="text-muted-foreground transition hover:text-destructive">
                          <Trash2 className="size-4" />
                        </button>
                      </div>
                      {item.kind === "combo" ? (
                        <div className="mt-1 flex flex-wrap gap-1">
                          {(item.comboItems ?? []).map((c, i) => (
                            <Badge key={i} variant="outline" className="font-normal text-[10px]">
                              {c.name}: {c.size}/{c.color}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Size {item.size} · {item.color}
                        </p>
                      )}
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex items-center rounded-lg border border-border">
                          <button onClick={() => updateQty(item.id, item.quantity - 1)} className="grid size-8 place-items-center text-muted-foreground transition hover:text-foreground" aria-label="Decrease">
                            <Minus className="size-3.5" />
                          </button>
                          <span className="w-7 text-center text-sm font-medium">{item.quantity}</span>
                          <button onClick={() => updateQty(item.id, item.quantity + 1)} className="grid size-8 place-items-center text-muted-foreground transition hover:text-foreground" aria-label="Increase">
                            <Plus className="size-3.5" />
                          </button>
                        </div>
                        <span className="text-sm font-semibold">{formatINR(item.unitPrice * item.quantity)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* footer */}
            <div className="border-t border-border">
              {/* coupon */}
              <div className="px-5 py-3">
                {appliedCoupon ? (
                  <div className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Tag className="size-4 text-emerald-600" />
                      <span className="font-medium text-emerald-700">{appliedCoupon.code}</span>
                      <span className="text-emerald-600">applied</span>
                    </div>
                    <button onClick={removeCoupon} className="text-emerald-700 transition hover:text-emerald-900" aria-label="Remove coupon">
                      <X className="size-4" />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApply} className="flex gap-2">
                    <Input name="coupon" placeholder="Coupon code" className="h-9" />
                    <Button type="submit" variant="outline" size="sm" className="h-9 shrink-0">Apply</Button>
                  </form>
                )}
              </div>
              <Separator />
              <div className="space-y-1.5 px-5 py-3 text-sm">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="text-foreground">{formatINR(subtotal)}</span></div>
                {discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-{formatINR(discount)}</span></div>}
                <div className="flex justify-between text-muted-foreground"><span>Shipping</span><span className="text-foreground">{shipping === 0 ? "Free" : formatINR(shipping)}</span></div>
                <Separator className="my-1" />
                <div className="flex justify-between text-base font-semibold"><span>Total</span><span>{formatINR(total)}</span></div>
              </div>
              <div className="flex gap-2 p-5 pt-2">
                <Button asChild className="flex-1" onClick={() => setCartOpen(false)}>
                  <Link href="/checkout">Checkout</Link>
                </Button>
              </div>
              <button onClick={clearCart} className="w-full pb-4 text-center text-xs text-muted-foreground transition hover:text-destructive">
                Clear bag
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
