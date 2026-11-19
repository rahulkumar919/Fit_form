import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    role?: "admin" | "customer";
  }
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: "admin" | "customer";
      userId: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "admin" | "customer";
    userId?: string;
  }
}
