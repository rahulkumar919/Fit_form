import { redirect } from "next/navigation";

/** Meesho sources are linked from the product form; prices are managed on /admin/meesho. */
export default function Page() {
  redirect("/admin/meesho");
}
