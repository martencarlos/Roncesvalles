// src/components/auth/auth-components.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

// Returns true once the session status has durably resolved.
//
// Problem this solves: on Android Chrome, locking/unlocking the phone or
// losing network causes useSession to cycle through loading → unauthenticated
// → loading → authenticated as the browser re-validates the session cookie, or
// to get stuck at unauthenticated due to a NetworkError (not a real logout).
//
// Strategy:
// - Once we see "authenticated", latch that fact. If status later goes back
//   to "loading" or transiently "unauthenticated", keep ready=false and wait.
// - If the device is offline and we were previously authenticated, never treat
//   "unauthenticated" as real — just keep waiting (no safety-valve redirect).
// - If status was never "authenticated" and reaches "unauthenticated" while
//   online, that is a genuine logged-out state → ready=true so page can redirect.
// - Safety valve: if status stays "loading" for 8 s while online, force ready=true.
export function useSessionReady(status: string): boolean {
  const [ready, setReady] = useState(status === "authenticated");
  const wasAuthenticatedRef = useRef(status === "authenticated");
  const statusRef = useRef(status);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep statusRef in sync so timer callbacks can read the current value
  statusRef.current = status;

  useEffect(() => {
    if (status === "authenticated") {
      wasAuthenticatedRef.current = true;
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      setReady(true);
      return;
    }

    if (status === "unauthenticated") {
      if (wasAuthenticatedRef.current) {
        // Transient unauthenticated after being authenticated.
        // Could be: phone unlock re-validation, or a NetworkError while offline.
        // Stay not-ready. Only start a safety-valve if online and none running.
        // The safety-valve only fires ready=true if status is still unauthenticated
        // (not loading) at fire time AND we're still online — avoids false redirects.
        setReady(false);
        if (!timerRef.current && navigator.onLine) {
          timerRef.current = setTimeout(() => {
            timerRef.current = null;
            if (statusRef.current === "unauthenticated" && navigator.onLine) {
              setReady(true);
            }
          }, 8000);
        }
      } else {
        // Never authenticated this session + online = genuine logout → redirect.
        // Never authenticated + offline = can't verify, keep spinner showing.
        if (navigator.onLine) {
          if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
          setReady(true);
        } else {
          setReady(false);
        }
      }
      return;
    }

    // status === "loading"
    setReady(false);
    // Only start the safety-valve if online and none is already running.
    // At fire time, re-check: if status resolved to authenticated in the meantime
    // the authenticated branch above already cleared the timer and set ready=true.
    if (!timerRef.current && navigator.onLine) {
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        if (statusRef.current !== "authenticated") {
          setReady(true);
        }
      }, 8000);
    }

    return () => {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    };
  }, [status]);

  // When coming back online after being offline, restart the safety-valve
  // so the page eventually unblocks if NextAuth doesn't re-fetch on its own.
  useEffect(() => {
    const handleOnline = () => {
      if (!ready && !timerRef.current) {
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          if (statusRef.current !== "authenticated") {
            setReady(true);
          }
        }, 8000);
      }
    };
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [ready]);

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