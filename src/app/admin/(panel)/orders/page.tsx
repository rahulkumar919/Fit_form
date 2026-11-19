import { Suspense } from "react";
import { getAdminOrders } from "@/services/admin";
import { OrdersTable } from "@/components/admin/orders-table";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage() {
  const orders = await getAdminOrders();
  return (
    <Suspense>
      <OrdersTable orders={orders} />
    </Suspense>
  );
}
