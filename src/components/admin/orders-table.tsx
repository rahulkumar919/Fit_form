"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, Clock, Search, ExternalLink, XCircle } from "lucide-react";
import { AdminCard } from "@/components/admin/admin-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { Order, OrderStatus } from "@/types";
import { formatINR, cn } from "@/lib/utils";
import { channelLabel } from "@/lib/tracking/source";
import { toast } from "sonner";

const ALL_STATUSES: OrderStatus[] = [
  "new", "pending_sourcing", "meesho_ordered", "processing", "shipped", "delivered", "cancelled", "returned",
];

const statusVariant: Record<string, "warning" | "secondary" | "default" | "success" | "danger" | "muted"> = {
  new: "warning", pending_sourcing: "warning", meesho_ordered: "secondary",
  processing: "secondary", shipped: "default", delivered: "success",
  cancelled: "danger", returned: "muted",
};

const label = (s: string) => s.replace(/_/g, " ");

/** True if payment has actually been received for this order. */
function isPaid(o: Order): boolean {
  if (o.paymentMethod === "cod") return true; // COD = paid on delivery
  if (o.paymentMethod === "partial_cod") return o.paymentStatus === "paid"; // fully collected
  return o.paymentStatus === "paid";
}

function PaymentBadge({ order }: { order: Order }) {
  const paid = isPaid(order);
  const failed = order.paymentStatus === "failed";
  const isCod = order.paymentMethod === "cod";
  const isPartialCod = order.paymentMethod === "partial_cod";

  if (isCod) {
    return (
      <div className="flex items-center gap-1">
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-blue-700">COD</span>
        {order.paymentStatus === "paid"
          ? <CheckCircle2 className="size-3.5 text-emerald-600" aria-label="Collected" />
          : <Clock className="size-3.5 text-amber-500" aria-label="On delivery" />
        }
      </div>
    );
  }
  if (isPartialCod) {
    return (
      <div className="flex items-center gap-1">
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-800">
          Partial COD
        </span>
        {paid
          ? <CheckCircle2 className="size-3.5 text-emerald-600" aria-label="Fully collected" />
          : order.paymentStatus === "partially_paid"
            ? <Clock className="size-3.5 text-amber-500" aria-label="Advance paid, COD pending" />
            : <AlertTriangle className="size-3.5 text-amber-500" aria-label="Advance pending" />
        }
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1">
      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase text-sky-950/70">
        {order.paymentMethod}
      </span>
      {paid
        ? <CheckCircle2 className="size-3.5 text-emerald-600" aria-label="Payment confirmed" />
        : failed
          ? <XCircle className="size-3.5 text-red-600" aria-label="Payment failed" />
          : <AlertTriangle className="size-3.5 text-amber-500" aria-label="Payment pending" />
      }
    </div>
  );
}

async function api(url: string, method: string, body: unknown) {
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.success) throw new Error(json.message ?? "Request failed");
  return json.data;
}

export function OrdersTable({ orders }: { orders: Order[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>(params.get("status") ?? "all");
  const [payFilter, setPayFilter] = React.useState<string>("all");
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [supplier, setSupplier] = React.useState("Meesho");
  const [meeshoId, setMeeshoId] = React.useState("");
  const [cost, setCost] = React.useState("");
  const [codCollecting, setCodCollecting] = React.useState(false);

  const selected = orders.find((o) => o.id === selectedId) ?? null;

  const unpaidOnline = orders.filter(
    (o) => o.paymentMethod !== "cod" && o.paymentStatus !== "paid" && o.status !== "cancelled",
  ).length;

  const filtered = orders.filter((o) => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (payFilter === "unpaid") {
      if (o.paymentMethod === "cod") return false;
      if (o.paymentStatus === "paid" || o.status === "cancelled") return false;
    } else if (payFilter === "paid") {
      if (!isPaid(o)) return false;
    }
    const term = q.trim().toLowerCase();
    if (term && !o.orderNumber.toLowerCase().includes(term) && !o.customerName.toLowerCase().includes(term)) return false;
    return true;
  });

  const changeStatus = async (status: OrderStatus) => {
    if (!selected) return;
    setBusy(true);
    try {
      await api(`/api/orders/${selected.id}/status`, "PATCH", { status });
      toast.success(`Status set to ${label(status)}`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update status");
    } finally {
      setBusy(false);
    }
  };

  const saveFulfillment = async () => {
    if (!selected) return;
    const sourceCost = Number(cost);
    if (!supplier.trim() || !meeshoId.trim() || !Number.isFinite(sourceCost) || sourceCost < 0 || cost === "") {
      toast.error("Enter supplier, Meesho order ID and the source cost");
      return;
    }
    setBusy(true);
    try {
      await api(`/api/orders/${selected.id}/fulfillment`, "POST", {
        sourceSupplier: supplier.trim(),
        meeshoOrderId: meeshoId.trim(),
        sourceCost,
      });
      toast.success("Fulfillment saved");
      setMeeshoId("");
      setCost("");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save fulfillment");
    } finally {
      setBusy(false);
    }
  };

  const markCodCollected = async () => {
    if (!selected) return;
    setBusy(true);
    setCodCollecting(false);
    try {
      await api(`/api/admin/orders/${selected.id}/cod-collected`, "POST", {});
      toast.success(`Remaining ₹${selected.remainingAmount?.toLocaleString("en-IN")} marked as collected`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not mark as collected");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-sky-950">Orders</h1>
          <p className="text-sm text-sky-950/70">{orders.length} total · {orders.filter(isPaid).length} paid</p>
        </div>
        {unpaidOnline > 0 && (
          <button
            type="button"
            onClick={() => setPayFilter("unpaid")}
            className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-sm font-medium text-amber-800 hover:bg-amber-100 transition"
          >
            <AlertTriangle className="size-4" aria-hidden />
            {unpaidOnline} unpaid online order{unpaidOnline > 1 ? "s" : ""} — click to filter
          </button>
        )}
      </div>

      <AdminCard>
        <div className="flex flex-wrap items-center gap-3 p-4 pb-2">
          <div className="relative min-w-[180px] max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Order # or customer…" className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{label(s)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={payFilter} onValueChange={setPayFilter}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All payments</SelectItem>
              <SelectItem value="paid">✅ Paid</SelectItem>
              <SelectItem value="unpaid">⚠️ Unpaid online</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-sm text-sky-950/70">
                  {orders.length === 0
                    ? "No orders yet. They will appear here as customers check out."
                    : "No orders match your filters."}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((o) => {
              const paid = isPaid(o);
              return (
                <TableRow
                  key={o.id}
                  className={cn("cursor-pointer", !paid && o.paymentMethod !== "cod" && "bg-amber-50/40")}
                  onClick={() => setSelectedId(o.id)}
                >
                  <TableCell className="font-medium">{o.orderNumber}</TableCell>
                  <TableCell>{o.customerName}</TableCell>
                  <TableCell className="text-gray-500">{o.date}</TableCell>
                  <TableCell><PaymentBadge order={o} /></TableCell>
                  <TableCell className="text-xs">
                    {channelLabel(o.attribution?.source ?? "direct")}
                    {o.attribution?.linkCode && <span className="block font-mono text-[10px] text-sky-950/65">/l/{o.attribution.linkCode}</span>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant[o.status]} className="text-[10px] capitalize">{label(o.status)}</Badge>
                  </TableCell>
                  <TableCell className={cn("text-right font-semibold", !paid && o.paymentMethod !== "cod" && "text-amber-700")}>
                    {formatINR(o.total)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon-sm" aria-label="Open order" onClick={(e) => { e.stopPropagation(); setSelectedId(o.id); }}>
                      <ExternalLink className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </AdminCard>

      {/* ── Order detail dialog ── */}
      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelectedId(null)}>
        {selected && (
          <DialogContent className="glass-dialog max-h-[90vh] max-w-2xl overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Order {selected.orderNumber}</DialogTitle>
              <DialogDescription>{selected.date} · {selected.customerName} · {selected.customerEmail}</DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-4">
              {/* ── Payment status alert ── */}
              {!isPaid(selected) && selected.paymentMethod !== "cod" && selected.paymentMethod !== "partial_cod" && (
                <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
                  <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" aria-hidden />
                  <div className="text-sm">
                    <p className="font-semibold text-amber-900">Payment not received</p>
                    <p className="text-amber-800">
                      This order was placed via <strong>{selected.paymentMethod.toUpperCase()}</strong> but payment
                      status is <strong>{selected.paymentStatus}</strong>.
                      Do <strong>not ship</strong> this order until payment is confirmed.
                    </p>
                    {selected.paymentStatus === "pending" && (
                      <p className="mt-1 text-xs text-amber-700">
                        Customer may have cancelled or closed the payment page. If payment arrives via
                        webhook it will auto-update. Otherwise mark it cancelled.
                      </p>
                    )}
                  </div>
                </div>
              )}
              {isPaid(selected) && selected.paymentMethod !== "cod" && selected.paymentMethod !== "partial_cod" && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <CheckCircle2 className="size-4 text-emerald-600" aria-hidden />
                  <p className="text-sm font-medium text-emerald-800">
                    Payment confirmed · {selected.paymentMethod.toUpperCase()}
                  </p>
                </div>
              )}
              {selected.paymentMethod === "cod" && (
                <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2">
                  <Clock className="size-4 text-blue-600" aria-hidden />
                  <p className="text-sm font-medium text-blue-800">
                    Cash on Delivery — collect ₹{selected.total.toLocaleString("en-IN")} at delivery
                  </p>
                </div>
              )}

              {/* ── Partial COD panel ── */}
              {selected.paymentMethod === "partial_cod" && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                  <p className="mb-2 text-sm font-semibold text-amber-900">Partial COD — payment summary</p>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between">
                      <span className="text-amber-800">Order total</span>
                      <span className="font-semibold">{formatINR(selected.total)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-800">Advance paid online</span>
                      <span className="font-semibold text-emerald-700">{formatINR(selected.advanceAmount ?? 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-amber-800">Remaining at delivery</span>
                      <span className="font-semibold text-amber-900">{formatINR(selected.remainingAmount ?? 0)}</span>
                    </div>
                    {selected.razorpayPaymentId && (
                      <div className="flex justify-between text-xs text-amber-700 pt-1 border-t border-amber-200">
                        <span>Razorpay Txn ID</span>
                        <span className="font-mono">{selected.razorpayPaymentId}</span>
                      </div>
                    )}
                  </div>

                  {/* Mark collected action */}
                  {selected.paymentStatus === "partially_paid" && !selected.codCollectedAt && (
                    <div className="mt-3">
                      {!codCollecting ? (
                        <button
                          type="button"
                          onClick={() => setCodCollecting(true)}
                          className="rounded-lg border border-amber-400 bg-amber-100 px-3 py-1.5 text-sm font-medium text-amber-900 transition hover:bg-amber-200"
                        >
                          Mark ₹{(selected.remainingAmount ?? 0).toLocaleString("en-IN")} as collected
                        </button>
                      ) : (
                        <div className="rounded-lg border border-amber-300 bg-white p-3 text-sm">
                          <p className="font-medium text-amber-900">Confirm collection?</p>
                          <p className="mt-0.5 text-xs text-amber-700">
                            Confirm you received ₹{(selected.remainingAmount ?? 0).toLocaleString("en-IN")} from the customer.
                            This cannot be undone.
                          </p>
                          <div className="mt-2 flex gap-2">
                            <Button size="sm" onClick={markCodCollected} disabled={busy}>
                              {busy ? "Saving…" : "Yes, collected"}
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => setCodCollecting(false)} disabled={busy}>
                              Cancel
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {selected.codCollectedAt && (
                    <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700">
                      <CheckCircle2 className="size-3.5" />
                      Collected on {new Date(selected.codCollectedAt).toLocaleDateString("en-IN")}
                      {selected.codCollectedBy ? ` by ${selected.codCollectedBy}` : ""}
                    </p>
                  )}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="admin">
                  From {channelLabel(selected.attribution?.source ?? "direct")}
                  {selected.attribution?.linkCode ? ` · /l/${selected.attribution.linkCode}` : ""}
                  {selected.attribution?.campaign ? ` · ${selected.attribution.campaign}` : ""}
                </Badge>
                <div className="ml-auto flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select value={selected.status} onValueChange={(v) => changeStatus(v as OrderStatus)} disabled={busy}>
                    <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ALL_STATUSES.map((s) => <SelectItem key={s} value={s}>{label(s)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                {selected.items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-3">
                    <div className="relative size-12 overflow-hidden rounded-md bg-muted">
                      {item.image && <Image src={item.image} alt={item.name} fill sizes="48px" className="object-cover" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[item.size, item.color].filter(Boolean).join(" · ")} · Qty {item.quantity}
                      </p>
                      {item.selections && item.selections.length > 0 && (
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {item.selections.map((s) => `${s.size}/${s.color}`).join(" · ")}
                        </p>
                      )}
                    </div>
                    <p className="text-sm font-semibold">{formatINR(item.price * item.quantity)}</p>
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatINR(selected.subtotal)}</span></div>
                {selected.discount > 0 && <div className="flex justify-between text-emerald-600"><span>Discount</span><span>-{formatINR(selected.discount)}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">Shipping</span><span>{selected.shipping === 0 ? "Free" : formatINR(selected.shipping)}</span></div>
                <div className="flex justify-between font-bold"><span>Total</span><span>{formatINR(selected.total)}</span></div>
              </div>

              <Separator />

              <div>
                <p className="mb-2 text-sm font-semibold text-foreground">Meesho sourcing</p>
                <p className="mb-2 text-xs text-muted-foreground">
                  Verify price and availability on Meesho, place the order yourself, then record it below.
                </p>
                {selected.fulfillments.map((f) => (
                  <div key={f.id} className="mb-2 rounded-lg bg-muted/50 p-3 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">{f.sourceSupplier}</span>
                      <Badge variant="muted" className="text-[10px] capitalize">{f.status}</Badge>
                    </div>
                    <p className="text-muted-foreground">Meesho ID: <span className="font-mono font-medium text-foreground">{f.meeshoOrderId}</span></p>
                    <p className="text-muted-foreground">Source cost: <span className="font-medium text-foreground">{formatINR(f.sourceCost)}</span></p>
                    {f.trackingId && <p className="text-muted-foreground">Tracking: <span className="font-mono text-foreground">{f.trackingId}</span></p>}
                  </div>
                ))}
                <div className="grid gap-2 rounded-lg border border-dashed border-border p-3 sm:grid-cols-3">
                  <div className="space-y-1">
                    <Label htmlFor="supplier" className="text-xs">Supplier</Label>
                    <Input id="supplier" value={supplier} onChange={(e) => setSupplier(e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="meeshoId" className="text-xs">Meesho order ID</Label>
                    <Input id="meeshoId" value={meeshoId} onChange={(e) => setMeeshoId(e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="cost" className="text-xs">Source cost (₹)</Label>
                    <Input id="cost" type="number" min={0} value={cost} onChange={(e) => setCost(e.target.value)} className="h-8 text-sm" />
                  </div>
                  <Button size="sm" onClick={saveFulfillment} disabled={busy} className="sm:col-span-3">
                    {busy ? "Saving…" : "Add fulfillment record"}
                  </Button>
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Delivery address</p>
                <p>{selected.address.fullName} · {selected.address.phone}</p>
                <p>{selected.address.line1}{selected.address.line2 ? `, ${selected.address.line2}` : ""}, {selected.address.city}, {selected.address.state} - {selected.address.pincode}</p>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div >
  );
}
