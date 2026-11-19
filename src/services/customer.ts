/** Signed-in customer's own profile data. */

import { connectDB, hasDB } from "@/lib/db/mongoose";
import { UserModel } from "@/models/User";
import { OBJECT_ID_RE } from "@/lib/catalog-constants";
import type { Address } from "@/types";

export async function getSavedAddresses(userId: string): Promise<Address[]> {
  if (!hasDB() || !OBJECT_ID_RE.test(userId)) return [];
  await connectDB();
  const user = await UserModel.findById(userId).select("addresses").lean();
  return ((user?.addresses ?? []) as unknown as (Address & { _id: unknown })[]).map((a) => ({
    id: String(a._id), label: a.label, fullName: a.fullName, phone: a.phone, line1: a.line1, line2: a.line2 ?? "",
    city: a.city, state: a.state, pincode: a.pincode, isDefault: !!a.isDefault,
  }));
}
