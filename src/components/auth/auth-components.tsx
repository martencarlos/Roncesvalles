// src/components/auth/auth-components.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Returns true once the session status is no longer 'loading',
// exported so other pages can use the same safety valve.
// with a safety valve for Android Chrome tab resume (where useSession
// can stay 'loading' indefinitely after the app is backgrounded).
export function useSessionReady(status: string): boolean {
  const [ready, setReady] = useState(status !== "loading");
  const suppressedRef = useRef(false);

  useEffect(() => {
    if (status !== "loading") {
      setReady(true);
      suppressedRef.current = false;
      return;
    }

    if (suppressedRef.current) return;

    // Safety valve: force-ready after 8 s or when the tab becomes visible again.
    const suppress = () => {
      suppressedRef.current = true;
      setReady(true);
    };

    const maxWait = setTimeout(suppress, 8000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") suppress();
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearTimeout(maxWait);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [status]);

  return ready;
}

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const ready = useSessionReady(status);

  useEffect(() => {
    if (!ready) return;
    if (!session) {
      router.push("/auth/signin");
    }
  }, [session, ready, router]);

  if (!ready) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>;
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}

export function RequireRole({
  children,
  allowedRoles
}: {
  children: React.ReactNode;
  allowedRoles: string[]
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const ready = useSessionReady(status);

  useEffect(() => {
    if (!ready) return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (!allowedRoles.includes(session.user.role)) {
      router.push("/unauthorized");
    }
  }, [session, ready, router, allowedRoles]);

  if (!ready) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
    </div>;
  }

  if (!session || !allowedRoles.includes(session.user.role)) {
    return null;
  }

  return <>{children}</>;
}