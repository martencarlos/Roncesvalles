// src/components/auth/auth-components.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Returns true once the session status has durably resolved.
//
// Problem this solves: on Android Chrome, locking and unlocking the phone
// causes useSession to cycle through loading → unauthenticated → loading →
// authenticated (or similar) as the browser re-validates the session cookie.
// Treating a transient "unauthenticated" as ready causes immediate redirects
// to sign-in and/or an infinite flash loop.
//
// Strategy:
// - Once we see "authenticated", latch that fact. If status later goes back
//   to "loading" or transiently "unauthenticated", keep ready=false and wait
//   for it to settle — the session is still being re-validated.
// - If status was never "authenticated" and reaches "unauthenticated", that
//   is a genuine logged-out state → ready=true so the page can redirect.
// - Safety valve: if status stays "loading" for 8 s, force ready=true.
export function useSessionReady(status: string): boolean {
  const [ready, setReady] = useState(status === "authenticated");
  const wasAuthenticatedRef = useRef(status === "authenticated");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      wasAuthenticatedRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      setReady(true);
      return;
    }

    if (status === "unauthenticated") {
      if (wasAuthenticatedRef.current) {
        // Transient unauthenticated after being authenticated = still re-validating.
        // Do NOT reset the latch — if the cycle repeats (loading→unauth→loading→unauth)
        // we still want to wait rather than redirect. The safety-valve timeout will
        // fire if it never comes back authenticated.
        setReady(false);
        // Only start the safety-valve if one isn't already running
        if (!timerRef.current) {
          timerRef.current = setTimeout(() => {
            timerRef.current = null;
            setReady(true);
          }, 8000);
        }
      } else {
        // Genuinely unauthenticated from the start → ready to redirect.
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = null;
        setReady(true);
      }
      return;
    }

    // status === "loading"
    setReady(false);
    // Only start the safety-valve if one isn't already running
    if (!timerRef.current) {
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setReady(true);
      }, 8000);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
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