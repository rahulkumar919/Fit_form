import { getSupplierRows } from "@/services/admin";
import { MeeshoManager } from "@/components/admin/meesho-manager";

export const dynamic = "force-dynamic";

export default async function MeeshoPage() {
  const { rows, unlinkedCount } = await getSupplierRows();
  return <MeeshoManager rows={rows} unlinkedCount={unlinkedCount} />;
}
