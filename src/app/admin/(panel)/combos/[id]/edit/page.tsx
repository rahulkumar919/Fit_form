import { notFound } from "next/navigation";
import { getAdminCombo, getPickerProducts } from "@/services/admin";
import { ComboForm } from "@/components/admin/combo-form";

export const dynamic = "force-dynamic";

export default async function EditComboPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [detail, products] = await Promise.all([getAdminCombo(id), getPickerProducts()]);
  if (!detail) notFound();
  return <ComboForm mode="edit" comboId={detail.id} initial={detail.values} products={products} />;
}
