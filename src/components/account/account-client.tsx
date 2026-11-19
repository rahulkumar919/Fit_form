"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Package, Heart, LogOut, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useStore } from "@/lib/store/store-provider";
import type { Address, Order } from "@/types";
import { AddressList } from "@/components/account/address-list";
import { formatINR } from "@/lib/utils";

export function AccountClient({ orders, addresses }: { orders: Order[]; addresses: Address[] }) {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { wishlist } = useStore();

  if (status === "loading") {
    return (
      <div className="container-store flex min-h-[50vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-foreground/20 border-t-foreground" />
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="container-store flex min-h-[50vh] flex-col items-center justify-center gap-4 py-16 text-center">
        <h1 className="font-serif text-2xl font-bold tracking-tight">You&apos;re signed out</h1>
        <p className="text-sm text-muted-foreground">Sign in to view your account, orders and wishlist.</p>
        <Button asChild><Link href="/login">Continue with Google</Link></Button>
      </div>
    );
  }

  const user = session.user;
  const initials = (user.name ?? "U").split(" ").map((n: string) => n[0]).join("").slice(0, 2);
  const myOrders = orders.slice(0, 4);
  const totalSpent = orders
    .filter((o) => o.status !== "cancelled" && o.status !== "returned")
    .reduce((sum, o) => sum + o.total, 0);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    toast.success("Signed out");
    router.push("/");
  };

  return (
    <div className="container-store py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar className="size-14">
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? "User"} />
            <AvatarFallback className="text-lg">{initials}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-serif text-2xl font-bold tracking-tight">{user.name}</h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
        <Button variant="outline" onClick={handleLogout}><LogOut className="size-4" /> Sign out</Button>
      </div>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { icon: Package, label: "Orders", value: orders.length, href: "/orders" },
          { icon: Heart, label: "Wishlist", value: wishlist.length, href: "/wishlist" },
          { icon: ShoppingBag, label: "Total spent", value: formatINR(totalSpent), href: "/orders" },
        ].map((s) => (
          <Link key={s.label} href={s.href}>
            <Card className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center gap-4 p-5">
                <div className="grid size-11 place-items-center rounded-full bg-muted"><s.icon className="size-5 text-foreground" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-bold text-foreground">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.5fr_1fr]">
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Recent orders</h2>
            <Button asChild variant="ghost" size="sm"><Link href="/orders">View all</Link></Button>
          </div>
          <div className="flex flex-col gap-3">
            {myOrders.length === 0 && (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                You have not placed any orders yet.
              </p>
            )}
            {myOrders.map((o) => (
              <Card key={o.id}>
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">{o.orderNumber}</span>
                      <Badge variant="muted" className="capitalize">{o.status.replace(/_/g, " ")}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{o.date} · {o.items.length} item(s)</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatINR(o.total)}</p>
                    <Button asChild variant="ghost" size="sm"><Link href="/orders">Track</Link></Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Saved addresses</h2>
            
          </div>
          <div className="flex flex-col gap-3">
            <AddressList addresses={addresses} />
          </div>
        </div>
      </div>
    </div>
  );
}
