"use client";

import * as React from "react";
import { Search } from "lucide-react";
import type { Customer } from "@/types";
import { AdminCard } from "@/components/admin/admin-card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { formatINR } from "@/lib/utils";

export function CustomersTable({ customers: CUSTOMERS }: { customers: Customer[] }) {
  const [q, setQ] = React.useState("");
  const filtered = CUSTOMERS.filter((c) =>
    c.name.toLowerCase().includes(q.toLowerCase()) ||
    c.email.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-sky-950">Customers</h1>
        <p className="text-sm text-sky-950/70">{CUSTOMERS.length} registered customers</p>
      </div>

      <AdminCard>
        <div className="flex items-center gap-3 p-4 pb-0">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-admin-card-foreground/40" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search customers…" className="pl-9" />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>City</TableHead>
              <TableHead className="text-right">Orders</TableHead>
              <TableHead className="text-right">Total spent</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-sm text-gray-500">
                  {CUSTOMERS.length === 0 ? "No customers have signed up yet." : "No customers match your search."}
                </TableCell>
              </TableRow>
            )}
            {filtered.map((c) => (
              <TableRow key={c.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback className="text-xs">{c.name.split(" ").map((n) => n[0]).join("")}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium text-admin-card-foreground">{c.name}</p>
                      <p className="text-xs text-admin-card-foreground/50">{c.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-admin-card-foreground/70">{c.phone}</TableCell>
                <TableCell>{c.city}</TableCell>
                <TableCell className="text-right font-medium">{c.orders}</TableCell>
                <TableCell className="text-right font-semibold">{formatINR(c.spent)}</TableCell>
                <TableCell className="text-admin-card-foreground/60">{c.joinedAt}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminCard>
    </div>
  );
}
