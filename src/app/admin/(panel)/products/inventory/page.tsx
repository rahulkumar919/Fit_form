import Link from "next/link";
import { getInventory } from "@/services/admin";
import { AdminCard } from "@/components/admin/admin-card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const dynamic = "force-dynamic";

/** Supplier availability per colour/size (lowest first). Edit units from the product form. */
export default async function InventoryPage() {
  const rows = await getInventory();
  const out = rows.filter((r) => r.available === 0).length;
  const low = rows.filter((r) => r.available > 0 && r.available < 5).length;
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-sky-950">Availability</h1>
        <p className="text-sm text-sky-950/70">
          Supplier availability per size. {out} out of stock · {low} running low. There is no physical stock: these numbers are what you last saw on Meesho.
        </p>
      </div>
      <AdminCard>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Product</TableHead><TableHead>Colour</TableHead><TableHead>Size</TableHead><TableHead className="text-right">Units</TableHead><TableHead>State</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && <TableRow><TableCell colSpan={5} className="py-12 text-center text-sm text-sky-950/70">No products yet.</TableCell></TableRow>}
              {rows.map((r, i) => (
                <TableRow key={`${r.productId}-${r.color}-${r.size}-${i}`}>
                  <TableCell><Link href={`/admin/products/${r.productId}/edit`} className="font-medium text-sky-950 hover:underline">{r.product}</Link>{r.status !== "active" && <span className="ml-2 text-xs text-sky-950/65">({r.status})</span>}</TableCell>
                  <TableCell>{r.color}</TableCell>
                  <TableCell>{r.size}</TableCell>
                  <TableCell className="text-right font-semibold">{r.available}</TableCell>
                  <TableCell><Badge variant={r.available === 0 ? "danger" : r.available < 5 ? "warning" : "success"} className="text-[10px]">{r.available === 0 ? "Out" : r.available < 5 ? "Low" : "OK"}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </AdminCard>
    </div>
  );
}
