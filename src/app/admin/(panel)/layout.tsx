import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/auth";
import { AdminIconSidebar } from "@/components/admin/icon-sidebar";
import { AdminShell } from "@/components/admin/admin-shell";
import { WaterBackdrop } from "@/components/admin/water-backdrop";
import { MediaConfigProvider } from "@/components/admin/media-config";
import { getSettings } from "@/services/settings";
import { cloudinaryConfigured } from "@/lib/storage";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Defence in depth: the proxy already guards /admin, but never rely on a
  // single layer. Non-admins are bounced to the admin login.
  const session = await auth();
  if (session?.user?.role !== "admin") redirect("/admin/login");
  const settings = await getSettings();

  return (
    <div className="admin-canvas flex h-screen overflow-hidden text-sky-950">
      <WaterBackdrop />

      <AdminIconSidebar />
      <AdminShell adminName={session.user.name ?? "Admin"} adminEmail={session.user.email ?? ""}>
        <MediaConfigProvider value={{ defaultProvider: settings.defaultStorage, cloudinaryEnabled: cloudinaryConfigured() }}>
          {children}
        </MediaConfigProvider>
      </AdminShell>
    </div>
  );
}
