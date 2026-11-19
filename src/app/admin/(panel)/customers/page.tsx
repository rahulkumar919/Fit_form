import { Download, Mail } from "lucide-react";
import { getAdminCustomers, getSubscribers } from "@/services/admin";
import { CustomersTable } from "@/components/admin/customers-table";
import { AdminCard, AdminCardContent, AdminCardHeader, AdminCardTitle } from "@/components/admin/admin-card";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" });

export default async function AdminCustomersPage() {
  const [customers, subscribers] = await Promise.all([getAdminCustomers(), getSubscribers(50)]);
  return (
    <div className="flex flex-col gap-6">
      <CustomersTable customers={customers} />

      <AdminCard>
        <AdminCardHeader>
          <AdminCardTitle className="flex items-center gap-2">
            <Mail className="size-4 text-sky-700" aria-hidden /> Newsletter subscribers
            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-800">{subscribers.total}</span>
          </AdminCardTitle>
          {subscribers.total > 0 && (
            <a
              href="/api/admin/subscribers"
              className="inline-flex items-center gap-1.5 rounded-lg border border-sky-900/15 bg-white/60 px-3 py-1.5 text-xs font-medium text-sky-900 transition hover:bg-white"
            >
              <Download className="size-3.5" aria-hidden /> Export CSV
            </a>
          )}
        </AdminCardHeader>
        <AdminCardContent>
          {subscribers.rows.length === 0 ? (
            <p className="py-6 text-center text-sm text-sky-900/60">No subscribers yet. Sign-ups from the homepage form appear here.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-sky-900/60">
                    <th scope="col" className="pb-2 font-medium">Email</th>
                    <th scope="col" className="pb-2 font-medium">Source</th>
                    <th scope="col" className="pb-2 text-right font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.rows.map((s) => (
                    <tr key={s.email} className="border-t border-sky-950/5">
                      <td className="py-2 pr-3 font-medium">{s.email}</td>
                      <td className="py-2 pr-3 capitalize text-sky-900/70">{s.source}</td>
                      <td className="py-2 text-right text-sky-900/70">{dateFmt.format(new Date(s.createdAt))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {subscribers.total > subscribers.rows.length && (
                <p className="mt-3 text-xs text-sky-900/60">Showing the latest {subscribers.rows.length}. Export CSV for the full list.</p>
              )}
            </div>
          )}
        </AdminCardContent>
      </AdminCard>
    </div>
  );
}
