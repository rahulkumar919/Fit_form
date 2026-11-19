"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { MapPin, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { Address } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function AddressList({ addresses }: { addresses: Address[] }) {
  const router = useRouter();
  const [busy, setBusy] = React.useState<string | null>(null);
  if (addresses.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        No saved addresses yet. Tick “Save this address” at checkout.
      </p>
    );
  }
  const remove = async (id: string) => {
    setBusy(id);
    try {
      const res = await fetch(`/api/user/addresses?id=${id}`, { method: "DELETE" });
      if (!res.ok) return toast.error("Could not remove the address");
      toast.success("Address removed");
      router.refresh();
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="flex flex-col gap-3">
      {addresses.map((a) => (
        <Card key={a.id}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MapPin className="size-4" />
              <span className="text-sm font-semibold">{a.label}</span>
              {a.isDefault && <Badge variant="secondary">Default</Badge>}
              <Button variant="ghost" size="icon-sm" className="ml-auto text-muted-foreground hover:text-destructive" disabled={busy === a.id}
                onClick={() => remove(a.id)} aria-label={`Remove ${a.label} address`}><Trash2 className="size-4" /></Button>
            </div>
            <p className="mt-2 text-sm">{a.fullName} · {a.phone}</p>
            <p className="text-sm text-muted-foreground">{a.line1}{a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} - {a.pincode}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
