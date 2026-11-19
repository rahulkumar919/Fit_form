import { getAdminProducts } from "@/services/admin";
import { ProductsTable } from "@/components/admin/products-table";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  return <ProductsTable rows={await getAdminProducts()} />;
}
