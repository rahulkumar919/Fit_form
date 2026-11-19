import { getCategoryRows } from "@/services/admin";
import { CategoriesManager } from "@/components/admin/categories-manager";

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  return <CategoriesManager rows={await getCategoryRows()} />;
}
