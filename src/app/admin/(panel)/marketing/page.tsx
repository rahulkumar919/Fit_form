import { redirect } from "next/navigation";

/** Marketing now lives at /admin/links (tracked links + attribution). */
export default function MarketingPage() {
  redirect("/admin/links");
}
