"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/admin/confirm-dialog";

export function CancelOrderButton({ orderId, orderNumber }: { orderId: string; orderNumber: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const cancel = async () => {
    const res = await fetch(`/api/orders/${orderId}/cancel`, { method: "POST" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.success) {
      toast.error(json.message ?? "Could not cancel the order");
      throw new Error("cancel failed");
    }
    toast.success(json.data.refundDue ? "Order cancelled. Your refund will be processed to the original payment method." : "Order cancelled");
    router.refresh();
  };
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>Cancel order</Button>
      <ConfirmDialog open={open} onOpenChange={setOpen} title={`Cancel order ${orderNumber}?`}
        description="You can cancel until we start sourcing your items." confirmLabel="Cancel order" onConfirm={cancel} />
    </>
  );
}
