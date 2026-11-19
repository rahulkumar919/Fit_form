import type { Metadata } from "next";
import { AccountClient } from "@/components/account/account-client";
import { auth } from "@/lib/auth/auth";
import { extractUserId } from "@/lib/api/auth-guard";
import { getOrdersForUser } from "@/services/orders";
import { getSavedAddresses } from "@/services/customer";

export const metadata: Metadata = {
  title: "My Account",
  description: "Your MelaMart account, orders and saved addresses.",
  alternates: { canonical: "/account" },
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();
  const uid = session ? extractUserId(session) : "";
  const [orders, addresses] = await Promise.all([uid ? getOrdersForUser(uid) : [], uid ? getSavedAddresses(uid) : []]);
  return <AccountClient orders={orders} addresses={addresses} />;
}
