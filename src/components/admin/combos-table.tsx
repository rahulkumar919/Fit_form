"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Plus, Pencil, ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { AdminComboRow } from "@/services/admin";
import { AdminCard } from "@/components/admin/admin-card";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatINR } from "@/lib/utils";

export function CombosTable({ rows }: { rows: AdminComboRow[] }) {
  const router = useRouter();
  const [toDelete, setToDelete] = React.useState<AdminComboRow | null>(null);

  const confirmDelete = async () => {
    if (!toDelete) return;
    const res = await fetch(`/api/admin/combos/${toDelete.combo.id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) {
      toast.error(json.message ?? "Could not delete the combo");
      throw new Error(json.message);
    }
    toast.success(`Deleted “${toDelete.combo.name}”`);
    router.refresh();
  };

  const active = rows.filter((r) => r.isActive).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-sky-950">Combos</h1>
          <p className="text-sm text-sky-950/70">{rows.length} combos · {active} active</p>
        </div>
        <Button asChild size="sm" className="btn-glass">
          <Link href="/admin/combos/new"><Plus /> Create combo</Link>
        </Button>
      </div>

      <AdminCard>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Combo</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Combo price</TableHead>
              <TableHead>Products total</TableHead>
              <TableHead>Savings</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-28"><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-sm text-sky-950/70">No combos yet. Create your first combo.</TableCell>
              </TableRow>
            )}
            {rows.map((row) => {
              const { combo: c, isActive } = row;
              const savings = c.combinedPrice - c.comboPrice;
              return (
                <TableRow key={c.id}>
                  <TableCell>
                    <Link href={`/admin/combos/${c.id}/edit`} className="flex items-center gap-3">
                      <div className="relative size-10 overflow-hidden rounded-lg bg-white/70">
                        {c.images[0] && <Image src={c.images[0]} alt="" fill sizes="40px" className="object-cover" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-sky-950">{c.name}</p>
                        <p className="text-xs text-sky-950/65">{c.tagline}</p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell>{c.items.length} items</TableCell>
                  <TableCell className="font-bold text-sky-800">{formatINR(c.comboPrice)}</TableCell>
                  <TableCell className="text-sky-950/70 line-through">{formatINR(c.combinedPrice)}</TableCell>
                  <TableCell>
                    <Badge variant={savings > 0 ? "success" : "danger"} className="text-[11px]">
                      {savings > 0 ? `-${formatINR(savings)}` : "No saving"}
                    </Badge>
                  </TableCell>
                  <TableCell><Badge variant={isActive ? "success" : "muted"} className="text-[11px]">{isActive ? "Active" : "Hidden"}</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {isActive && (
                        <Button asChild variant="ghost" size="icon-sm" aria-label={`View ${c.name} on store`}>
                          <Link href={`/combo/${c.slug}`} target="_blank"><ExternalLink className="size-4" /></Link>
                        </Button>
                      )}
                      <Button asChild variant="ghost" size="icon-sm" aria-label={`Edit ${c.name}`}>
                        <Link href={`/admin/combos/${c.id}/edit`}><Pencil className="size-4" /></Link>
                      </Button>
                      <Button variant="ghost" size="icon-sm" className="text-red-700" aria-label={`Delete ${c.name}`} onClick={() => setToDelete(row)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
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
        title="Delete this combo?"
        description={<>“{toDelete?.combo.name}” will be removed from the store. Its products are not affected.</>}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
