"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ExternalLink, History, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { AdminCard, AdminCardContent, AdminCardHeader, AdminCardTitle } from "@/components/admin/admin-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatINR } from "@/lib/utils";

export interface SupplierRow {
  id: string;
  productId: string;
  productName: string;
  meeshoUrl: string;
  meeshoRef: string;
  supplier: string;
  sourcePrice: number;
  sellingPrice: number;
  totalCost: number;
  estimatedProfit: number;
  available: boolean;
  status: string;
  lastPriceChecked: string;
  history: { date: string; sourcePrice: number; note: string }[];
}

const STALE_DAYS = 7;
const statusVariant: Record<string, "success" | "warning" | "danger" | "muted"> = {
  linked: "success", price_changed: "warning", out_of_stock: "danger", unlinked: "muted",
};

export function MeeshoManager({ rows, unlinkedCount }: { rows: SupplierRow[]; unlinkedCount: number }) {
  const router = useRouter();
  const [checking, setChecking] = React.useState<SupplierRow | null>(null);
  const [price, setPrice] = React.useState("");
  const [available, setAvailable] = React.useState(true);
  const [note, setNote] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [historyOf, setHistoryOf] = React.useState<SupplierRow | null>(null);

  // Captured once per mount so render stays pure; router.refresh() re-renders with fresh rows.
  const [now] = React.useState(() => Date.now());
  const stale = (r: SupplierRow) => now - new Date(r.lastPriceChecked).getTime() > STALE_DAYS * 86_400_000;
  const changed = rows.filter((r) => r.status === "price_changed").length;
  const out = rows.filter((r) => !r.available).length;
  const losing = rows.filter((r) => r.estimatedProfit < 0).length;
  const staleCount = rows.filter(stale).length;

  const open = (r: SupplierRow) => {
    setChecking(r);
    setPrice(String(r.sourcePrice));
    setAvailable(r.available);
    setNote("");
  };

  const save = async () => {
    if (!checking) return;
    const n = Number(price);
    if (!Number.isFinite(n) || n < 0 || price.trim() === "") return toast.error("Enter the current Meesho price");
    setBusy(true);
    try {
      const res = await fetch(`/api/meesho/${checking.id}/price-check`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newSourcePrice: n, available, note: note || "Manual check" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) return toast.error(json.message ?? "Could not save the check");
      if (json.data.priceChanged) toast.warning(`Price changed ${formatINR(json.data.oldPrice)} → ${formatINR(json.data.newPrice)}. Profit is now ${formatINR(json.data.estimatedProfit)}.`);
      else toast.success("Check recorded");
      setChecking(null);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-sky-950">Meesho sourcing</h1>
          <p className="text-sm text-sky-950/70">Source links, costs and margins. Prices are entered by you after checking Meesho; nothing is scraped.</p>
        </div>
        <Button asChild className="btn-glass"><Link href="/admin/products">Link a product</Link></Button>
      </div>

      {(changed > 0 || out > 0 || losing > 0 || staleCount > 0 || unlinkedCount > 0) && (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {changed > 0 && <Alert tone="amber" text={`${changed} source price${changed > 1 ? "s" : ""} changed. Review selling prices.`} />}
          {losing > 0 && <Alert tone="red" text={`${losing} product${losing > 1 ? "s" : ""} would sell at a loss.`} />}
          {out > 0 && <Alert tone="red" text={`${out} marked unavailable on Meesho.`} />}
          {staleCount > 0 && <Alert tone="amber" text={`${staleCount} not checked in ${STALE_DAYS}+ days.`} />}
          {unlinkedCount > 0 && <Alert tone="sky" text={`${unlinkedCount} active product${unlinkedCount > 1 ? "s have" : " has"} no Meesho source.`} />}
        </div>
      )}

      <AdminCard>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead className="text-right">Source</TableHead>
                <TableHead className="text-right">All-in cost</TableHead>
                <TableHead className="text-right">Selling</TableHead>
                <TableHead className="text-right">Profit / unit</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last checked</TableHead>
                <TableHead><span className="sr-only">Actions</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow><TableCell colSpan={9} className="py-12 text-center text-sm text-sky-950/70">No Meesho sources yet. Open a product and turn on “Link a Meesho product”.</TableCell></TableRow>
              )}
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="min-w-48">
                    <Link href={`/admin/products/${r.productId}/edit`} className="font-medium text-sky-950 hover:underline">{r.productName}</Link>
                    {r.meeshoRef && <p className="text-[11px] text-sky-950/65">Ref {r.meeshoRef}</p>}
                  </TableCell>
                  <TableCell className="text-sky-950/80">{r.supplier || "—"}</TableCell>
                  <TableCell className="text-right">{formatINR(r.sourcePrice)}</TableCell>
                  <TableCell className="text-right">{formatINR(r.totalCost)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatINR(r.sellingPrice)}</TableCell>
                  <TableCell className={`text-right font-semibold ${r.estimatedProfit < 0 ? "text-red-700" : "text-emerald-700"}`}>
                    {formatINR(r.estimatedProfit)}
                    <span className="block text-[10px] font-normal text-sky-950/65">{r.sellingPrice ? Math.round((r.estimatedProfit / r.sellingPrice) * 100) : 0}%</span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={r.available ? statusVariant[r.status] ?? "muted" : "danger"} className="whitespace-nowrap text-[10px]">
                      {r.available ? r.status.replace(/_/g, " ") : "unavailable"}
                    </Badge>
                  </TableCell>
                  <TableCell className={`whitespace-nowrap text-xs ${stale(r) ? "font-semibold text-amber-700" : "text-sky-950/70"}`}>
                    {new Date(r.lastPriceChecked).toLocaleDateString("en-IN")}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button asChild variant="ghost" size="icon-sm" aria-label={`Open ${r.productName} on Meesho`}>
                        <a href={r.meeshoUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="size-4" /></a>
                      </Button>
                      <Button variant="ghost" size="icon-sm" aria-label={`Price history for ${r.productName}`} onClick={() => setHistoryOf(r)}><History className="size-4" /></Button>
                      <Button variant="outline" size="sm" onClick={() => open(r)}><RefreshCcw /> Check</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </AdminCard>

      <AdminCard>
        <AdminCardHeader><AdminCardTitle>Order sourcing workflow</AdminCardTitle></AdminCardHeader>
        <AdminCardContent>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-sky-950/85">
            <li>A customer order appears in <Link href="/admin/orders" className="underline">Orders</Link> as “new”.</li>
            <li>Open the Meesho link here and confirm the size, colour and current price.</li>
            <li>Record the check (price + availability) with the Check button.</li>
            <li>Place the order through Meesho&apos;s reseller flow yourself.</li>
            <li>In the order, add a fulfillment record with the Meesho order ID and cost (one per supplier for combos).</li>
            <li>Update the order status and tracking as it ships.</li>
          </ol>
        </AdminCardContent>
      </AdminCard>

      <Dialog open={!!checking} onOpenChange={(v) => !v && !busy && setChecking(null)}>
        {checking && (
          <DialogContent className="glass-dialog max-w-md">
            <DialogHeader>
              <DialogTitle>Record a Meesho check</DialogTitle>
              <DialogDescription>{checking.productName}. Open the listing, then enter what you see now.</DialogDescription>
            </DialogHeader>
            <a href={checking.meeshoUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-sky-800 underline">
              Open on Meesho <ExternalLink className="size-3.5" />
            </a>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="mc-price" className="mb-1.5 block">Current source price (₹)</Label>
                <Input id="mc-price" type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} />
                <p className="mt-1 text-xs text-sky-950/65">Was {formatINR(checking.sourcePrice)}.</p>
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="mc-avail" className="font-normal">Available on Meesho</Label>
                <Switch id="mc-avail" checked={available} onCheckedChange={setAvailable} />
              </div>
              <div>
                <Label htmlFor="mc-note" className="mb-1.5 block">Note (optional)</Label>
                <Input id="mc-note" value={note} maxLength={120} onChange={(e) => setNote(e.target.value)} placeholder="Size 32 low stock" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setChecking(null)} disabled={busy}>Cancel</Button>
              <Button className="btn-glass" onClick={save} disabled={busy}>{busy ? "Saving…" : "Save check"}</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>

      <Dialog open={!!historyOf} onOpenChange={(v) => !v && setHistoryOf(null)}>
        {historyOf && (
          <DialogContent className="glass-dialog max-w-md">
            <DialogHeader>
              <DialogTitle>Price history</DialogTitle>
              <DialogDescription>{historyOf.productName}</DialogDescription>
            </DialogHeader>
            {historyOf.history.length === 0 ? (
              <p className="text-sm text-muted-foreground">No checks recorded yet.</p>
            ) : (
              <ul className="max-h-80 space-y-2 overflow-y-auto">
                {historyOf.history.map((h, i) => (
                  <li key={i} className="flex items-center justify-between gap-3 rounded-lg bg-white/70 px-3 py-2 text-sm">
                    <span>
                      <span className="block font-medium">{formatINR(h.sourcePrice)}</span>
                      <span className="text-xs text-muted-foreground">{h.note}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">{new Date(h.date).toLocaleDateString("en-IN")}</span>
                  </li>
                ))}
              </ul>
            )}
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

function Alert({ tone, text }: { tone: "amber" | "red" | "sky"; text: string }) {
  const cls = tone === "red" ? "border-red-300 bg-red-50/90 text-red-900" : tone === "amber" ? "border-amber-300 bg-amber-50/90 text-amber-900" : "border-sky-300 bg-sky-50/90 text-sky-900";
  return (
    <div role="status" className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-sm ${cls}`}>
      <AlertTriangle className="mt-0.5 size-4 shrink-0" /> {text}
    </div>
  );
}
