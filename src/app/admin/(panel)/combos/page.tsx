import { getAdminCombos } from "@/services/admin";
import { CombosTable } from "@/components/admin/combos-table";

export const dynamic = "force-dynamic";

export default async function AdminCombosPage() {
  return <CombosTable rows={await getAdminCombos()} />;
}
