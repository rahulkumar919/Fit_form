import { redirect } from "next/navigation";

/** Categories moved to their own section. */
export default function LegacyCategoriesPage() {
  redirect("/admin/categories");
}
