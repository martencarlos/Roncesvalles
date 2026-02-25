// src/providers/NextAuthProvider.tsx
"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loading } from "@/components/ui/loading";

// Protected paths that require authentication
const AUTH_SENSITIVE_PATHS = ['/bookings', '/admin', '/profile', '/activity', '/notifications'];

// AuthLoader sits between SessionProvider and the rest of the app.
// It solves the Android Chrome PWA resume problem: when the phone is locked
// and unlocked, NextAuth re-validates the session cookie and status cycles
// through loading → unauthenticated → loading → authenticated before settling.
// Without this guard, pages render during the transient "unauthenticated" moment
// and fire redirect loops.
//
// Rules:
// 1. Once status reaches "authenticated", latch it permanently. Never block again.
// 2. On a protected path: block while status is "loading" or transiently
//    "unauthenticated" (after having been authenticated).
// 3. "unauthenticated" with no prior authenticated state = genuine logout →
//    unblock immediately so the page's redirect logic can send to /signin.
// 4. Safety valve: if blocked for more than 10s, unblock unconditionally.
function AuthLoader({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();

  const wasAuthenticatedRef = useRef(status === "authenticated");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isProtected = AUTH_SENSITIVE_PATHS.some(p => pathname.startsWith(p));

  const [blocked, setBlocked] = useState(
    // Start blocked only on protected paths when session not yet known
    isProtected && status !== "authenticated"
  );

  // Track pathname in a ref so the status effect doesn't depend on it
  // (pathname changes must not cancel an active safety-valve timer)
  const isProtectedRef = useRef(isProtected);
  useEffect(() => {
    isProtectedRef.current = isProtected;
  }, [isProtected]);

  useEffect(() => {
    if (status === "authenticated") {
      wasAuthenticatedRef.current = true;
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      setBlocked(false);
      return;
    }

    if (!isProtectedRef.current) {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      setBlocked(false);
      return;
    }

    // Protected path + not authenticated
    if (status === "unauthenticated" && !wasAuthenticatedRef.current) {
      // Never authenticated this session → genuine logout, unblock for redirect
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      setBlocked(false);
      return;
    }

    // status === "loading", or transient "unauthenticated" after being authenticated
    // → block children and wait, with a 10s safety valve
    setBlocked(true);
    if (!timerRef.current) {
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setBlocked(false);
      }, 10000);
    }
  }, [status]); // intentionally only status — pathname changes must not reset the timer

  // When navigating to a protected path while unblocked and not authenticated,
  // re-block so the new page doesn't flash before the session settles.
  useEffect(() => {
    if (isProtected && status === "loading") {
      setBlocked(true);
      if (!timerRef.current) {
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          setBlocked(false);
        }, 10000);
      }
    }
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup on unmount only
  useEffect(() => {
    return () => {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    };
  }, []);

  if (blocked) {
    return (
      <Loading
        fullScreen
        size="lg"
        message="Cargando su sesión"
        submessage="Por favor espere..."
      />
    );
  }

  return <>{children}</>;
}

export function NextAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <AuthLoader>{children}</AuthLoader>
    </SessionProvider>
  );
}
