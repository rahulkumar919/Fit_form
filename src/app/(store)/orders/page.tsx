import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Package, Truck, CheckCircle2, Clock, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth/auth";
import { extractUserId } from "@/lib/api/auth-guard";
import { getOrdersForUser } from "@/services/orders";
import { getProductsByIds } from "@/services/catalog";
import { CancelOrderButton } from "@/components/account/cancel-order-button";
import { formatINR, cn } from "@/lib/utils";

const STATUS_FLOW = ["new", "pending_sourcing", "meesho_ordered", "processing", "shipped", "delivered"] as const;

const statusLabel: Record<string, string> = {
  new: "Order placed",
  pending_sourcing: "Pending sourcing",
  meesho_ordered: "Sourced",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  returned: "Returned",
};

const statusVariant: Record<string, "secondary" | "success" | "warning" | "danger" | "muted" | "default"> = {
  new: "warning",
  pending_sourcing: "warning",
  meesho_ordered: "secondary",
  processing: "secondary",
  shipped: "default",
  delivered: "success",
  cancelled: "danger",
  returned: "muted",
};

export const metadata: Metadata = {
  title: "My orders",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const session = await auth();
  const ORDERS = session ? await getOrdersForUser(extractUserId(session)) : [];
  const reviewable = await getProductsByIds(
    ORDERS.filter((o) => o.status === "delivered").flatMap((o) => o.items.filter((i) => i.kind === "product" && i.refId).map((i) => i.refId!)),
  );
  const slugOf = new Map(reviewable.map((p) => [p.id, p.slug]));
  const ReviewLink = ({ productId }: { productId: string }) =>
    slugOf.has(productId) ? (
      <Link href={`/product/${slugOf.get(productId)}#reviews`} className="text-xs font-medium text-sale underline-offset-2 hover:underline">
        Write a review
      </Link>
    ) : null;
  return (
    <div className="container-store py-10">
      <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">My orders</h1>
      <p className="mt-1 text-sm text-muted-foreground">Track and manage your purchases.</p>

      {ORDERS.length === 0 && (
        <div className="mt-16 flex flex-col items-center gap-4 text-center">
          <div className="grid size-16 place-items-center rounded-full bg-muted"><Package className="size-7 text-muted-foreground" /></div>
          <div>
            <p className="font-medium text-foreground">No orders yet</p>
            <p className="text-sm text-muted-foreground">When you place an order, you can track it here.</p>
          </div>
          <Button asChild><Link href="/shop/all-products">Start shopping</Link></Button>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-5">
        {ORDERS.map((order) => {
          const isCancelled = order.status === "cancelled" || order.status === "returned";
          const currentIdx = (STATUS_FLOW as readonly string[]).indexOf(order.status);
          return (
            <Card key={order.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{order.orderNumber}</span>
                      <Badge variant={statusVariant[order.status] ?? "muted"} className="capitalize">{statusLabel[order.status]}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">Placed on {order.date} · {order.paymentMethod.toUpperCase()} · {order.paymentStatus}</p>
                  </div>
                  <div className="flex items-center gap-3 sm:flex-col sm:items-end sm:gap-1">
                    <p className="text-lg font-bold">{formatINR(order.total)}</p>
                    <p className="text-xs text-muted-foreground">{order.items.length} item(s)</p>
                    {order.status === "new" && <CancelOrderButton orderId={order.id} orderNumber={order.orderNumber} />}
                  </div>
                </div>
                <Separator />

                {/* items */}
                <div className="flex flex-col gap-3 p-5">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-muted">
                        <Image src={item.image} alt={item.name} fill sizes="56px" className="object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.size} · Qty {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <span className="block text-sm font-semibold">{formatINR(item.price * item.quantity)}</span>
                        {order.status === "delivered" && item.kind === "product" && item.refId && (
                          <ReviewLink productId={item.refId} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* timeline */}
                <div className="border-t border-border bg-muted/30 p-5">
                  {!isCancelled && currentIdx >= 0 ? (
                    <div className="flex items-center justify-between">
                      {STATUS_FLOW.map((step, i) => {
                        const done = i <= currentIdx;
                        const icons = [Clock, Package, Truck, Package, Truck, CheckCircle2];
                        const Icon = icons[i];
                        return (
                          <div key={step} className="flex flex-1 flex-col items-center gap-1.5 text-center">
                            <div className={cn("grid size-8 place-items-center rounded-full transition", done ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}>
                              <Icon className="size-4" />
                            </div>
                            <span className={cn("text-[10px] sm:text-xs", done ? "font-medium text-foreground" : "text-muted-foreground")}>{statusLabel[step]}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <XCircle className="size-4 text-destructive" />
                      {order.status === "cancelled" ? "This order was cancelled." : "This order was returned and refunded."}
                    </div>
                  )}
                  {order.fulfillments[0]?.trackingId && (
                    <p className="mt-3 text-xs text-muted-foreground">
                      Tracking ID: <span className="font-mono font-medium text-foreground">{order.fulfillments[0].trackingId}</span> via {order.fulfillments[0].carrier}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
