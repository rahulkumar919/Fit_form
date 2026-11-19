import { notFound } from "next/navigation";
import { getAdminProduct, getProductCategoryOptions } from "@/services/admin";
import { ProductForm } from "@/components/admin/product-form";
export const dynamic = "force-dynamic";
export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [detail, categories] = await Promise.all([getAdminProduct(id), getProductCategoryOptions()]);
  if (!detail) notFound();
  return (
    <ProductForm
      mode="edit"
      productId={detail.id}
      initial={detail.values}
      usedInCombos={detail.usedInCombos}
      categories={categories}
    />
  );
}
