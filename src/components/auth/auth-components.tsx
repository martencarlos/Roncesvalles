// src/components/auth/auth-components.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// AuthLoader in NextAuthProvider already ensures that by the time any page
// renders on a protected path, the session status has durably settled.
// useSessionReady is kept for compatibility but is now a simple check.
export function useSessionReady(status: string): boolean {
  return status !== "loading";
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, status, router]);

  if (status === "loading" || !session) return null;

  return <>{children}</>;
}

export function RequireRole({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles: string[];
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/auth/signin");
      return;
    }
    if (!allowedRoles.includes(session.user.role)) {
      router.push("/unauthorized");
    }
  }, [session, status, router, allowedRoles]);

  if (status === "loading" || !session || !allowedRoles.includes(session.user.role)) return null;

  return <>{children}</>;
}
