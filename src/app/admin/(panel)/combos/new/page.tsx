import { getPickerProducts } from "@/services/admin";
import { ComboForm } from "@/components/admin/combo-form";

export const dynamic = "force-dynamic";

export default async function NewComboPage() {
  return <ComboForm mode="create" products={await getPickerProducts()} />;
}
