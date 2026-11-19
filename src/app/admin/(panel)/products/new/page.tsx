import { ProductForm } from "@/components/admin/product-form";
import { getProductCategoryOptions } from "@/services/admin";
export const dynamic = "force-dynamic";
export default async function NewProductPage() {
  return <ProductForm mode="create" categories={await getProductCategoryOptions()} />;
}
