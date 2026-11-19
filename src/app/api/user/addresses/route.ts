/** DELETE /api/user/addresses?id= — remove one of the signed-in customer's saved addresses. */

import { NextRequest } from "next/server";
import { connectDB, hasDB } from "@/lib/db/mongoose";
import { UserModel } from "@/models/User";
import { badRequest, notFound, ok, serverError } from "@/lib/api/response";
import { extractUserId, requireAuth } from "@/lib/api/auth-guard";
import { OBJECT_ID_RE } from "@/lib/catalog-constants";

export async function DELETE(req: NextRequest) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;
    const id = new URL(req.url).searchParams.get("id") ?? "";
    if (!OBJECT_ID_RE.test(id)) return badRequest("Invalid address");
    if (!hasDB()) return notFound("Address not found");
    await connectDB();
    const user = await UserModel.findById(extractUserId(session!)).select("addresses");
    if (!user) return notFound("Address not found");
    const before = user.addresses.length;
    user.addresses = user.addresses.filter((a) => String((a as unknown as { _id: string })._id) !== id) as never;
    if (user.addresses.length === before) return notFound("Address not found");
    if (user.addresses.length && !user.addresses.some((a) => a.isDefault)) user.addresses[0].isDefault = true;
    await user.save();
    return ok({ id });
  } catch (err) {
    return serverError(err);
  }
}
