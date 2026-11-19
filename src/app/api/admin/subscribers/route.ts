/** GET /api/admin/subscribers — CSV export of opted-in newsletter subscribers (admin only). */
import { connectDB, hasDB } from "@/lib/db/mongoose";
import { SubscriberModel } from "@/models/Subscriber";
import { serverError } from "@/lib/api/response";
import { requireAdmin } from "@/lib/api/auth-guard";
import { logAdminAction } from "@/lib/audit";

/** Quote a CSV cell and neutralise spreadsheet formula injection (=, +, -, @). */
function cell(v: string): string {
  const safe = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET() {
  try {
    const { session, error } = await requireAdmin();
    if (error) return error;
    const rows: string[] = ["email,source,subscribed_at"];
    if (hasDB()) {
      await connectDB();
      const docs = await SubscriberModel.find({ status: "subscribed" }).sort({ createdAt: -1 }).limit(50_000).lean();
      for (const d of docs) rows.push([cell(d.email), cell(d.source ?? ""), cell(new Date(d.createdAt).toISOString())].join(","));
    }
    await logAdminAction(session!, "export", "subscribers", "", `${rows.length - 1} rows`).catch(() => undefined);
    return new Response(rows.join("\n") + "\n", {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="melamart-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    return serverError(err);
  }
}
