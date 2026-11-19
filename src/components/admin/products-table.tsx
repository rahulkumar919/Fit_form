"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, Eye, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import type { AdminProductRow } from "@/services/admin";
import { AdminCard } from "@/components/admin/admin-card";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { formatINR } from "@/lib/utils";

export function ProductsTable({ rows }: { rows: AdminProductRow[] }) {
  const router = useRouter();
  const [q, setQ] = React.useState("");
  const [toDelete, setToDelete] = React.useState<AdminProductRow | null>(null);

  const term = q.trim().toLowerCase();
  const filtered = rows.filter(
    ({ product: p }) => p.name.toLowerCase().includes(term) || p.categoryLabel.toLowerCase().includes(term),
  );

  const confirmDelete = async () => {
    if (!toDelete) return;
    const res = await fetch(`/api/admin/products/${toDelete.product.id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) {
      toast.error(json.message ?? "Could not delete the product");
      throw new Error(json.message);
    }
    toast.success(`Deleted “${toDelete.product.name}”`);
    router.refresh();
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-sky-950">Products</h1>
          <p className="text-sm text-sky-950/70">{rows.length} total products</p>
        </div>
        <Button asChild size="sm" className="btn-glass">
          <Link href="/admin/products/new"><Plus /> Add product</Link>
        </Button>
      </div>

      <AdminCard>
        <div className="flex items-center gap-3 p-4 pb-0">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-sky-950/65" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" className="pl-9" aria-label="Search products" />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Source price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Sales</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-10"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-sm text-sky-950/70">
                  {rows.length === 0 ? "No products yet. Add your first product." : "No products match your search."}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((row) => {
              const { product: p, sourcePrice } = row;
              const stock = p.variants.flatMap((v) => v.sizes).reduce((n, z) => n + z.available, 0);
              const sales = row.sales;
              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/admin/products/${p.id}/edit`} className="flex items-center gap-3">
                      <div className="relative size-10 overflow-hidden rounded-lg bg-white/70">
                        {p.images[0] && <Image src={p.images[0]} alt="" fill sizes="40px" className="object-cover" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-sky-950">{p.name}</p>
                        <p className="text-xs text-sky-950/65">/{p.slug}</p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell><Badge variant="secondary" className="text-[11px]">{p.categoryLabel}</Badge></TableCell>
                  <TableCell className="font-semibold">{formatINR(p.price)}</TableCell>
                  <TableCell className="text-sky-950/70">{sourcePrice !== undefined ? formatINR(sourcePrice) : "—"}</TableCell>
                  <TableCell className={stock === 0 ? "font-semibold text-red-700" : stock < 20 ? "font-semibold text-amber-700" : ""}>{stock}</TableCell>
                  <TableCell>
                    {sales && sales.total > 0 ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1 text-sm font-semibold text-sky-950">
                          <TrendingUp className="size-3.5 text-emerald-600" />
                          {sales.total}
                        </span>
                        <span className="text-[10px] text-sky-950/50">
                          {sales.last7}↑ 7d · {sales.last30}↑ 30d
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-sky-950/40">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={p.status === "active" ? "success" : p.status === "draft" ? "warning" : "muted"} className="text-[11px]">{p.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${p.name}`}><MoreHorizontal /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass-dialog">
                        {p.status === "active" && (
                          <DropdownMenuItem asChild><Link href={`/product/${p.slug}`} target="_blank"><Eye className="size-4" /> View on store</Link></DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild><Link href={`/admin/products/${p.id}/edit`}><Pencil className="size-4" /> Edit</Link></DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-700 focus:text-red-700" onSelect={() => setToDelete(row)}>
                          <Trash2 className="size-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </AdminCard>

      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        title="Delete this product?"
        description={<>“{toDelete?.product.name}” and its Meesho link will be permanently removed. This cannot be undone. Products used in combos cannot be deleted; archive them instead.</>}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
