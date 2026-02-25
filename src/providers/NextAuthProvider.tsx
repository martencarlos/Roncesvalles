// src/providers/NextAuthProvider.tsx
"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loading } from "@/components/ui/loading";

// Protected paths that require authentication
const AUTH_SENSITIVE_PATHS = ['/bookings', '/admin', '/profile', '/activity', '/notifications'];

// AuthLoader sits between SessionProvider and the rest of the app.
// It solves the Android Chrome PWA resume problem: when the phone is locked
// and unlocked, NextAuth re-validates the session cookie and status cycles
// through loading → unauthenticated → loading → authenticated before settling.
// Without this guard, pages render during the transient "unauthenticated" moment
// and fire redirect loops that flash the spinner indefinitely.
//
// Rules:
// 1. Once status reaches "authenticated", latch it. Never block again for this session.
// 2. On a protected path: if status is "loading" or transiently "unauthenticated"
//    (after having been authenticated), block and show the full-screen loader.
// 3. "unauthenticated" with no prior authenticated state = genuine logout → unblock
//    immediately so the page's own redirect logic can send to /signin.
// 4. Safety valve: if blocked for more than 10s, unblock unconditionally.
function AuthLoader({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const wasAuthenticatedRef = useRef(status === "authenticated");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [blocked, setBlocked] = useState(() => {
    // Block on protected paths until session resolves
    const isProtected = AUTH_SENSITIVE_PATHS.some(p => pathname.startsWith(p));
    return isProtected && status !== "authenticated";
  });

  useEffect(() => {
    const isProtected = AUTH_SENSITIVE_PATHS.some(p => pathname.startsWith(p));

    const unblock = () => {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
      setBlocked(false);
    };

    const block = () => {
      setBlocked(true);
      if (!timerRef.current) {
        timerRef.current = setTimeout(() => {
          timerRef.current = null;
          setBlocked(false);
        }, 10000);
      }
    };

    if (status === "authenticated") {
      wasAuthenticatedRef.current = true;
      unblock();
      return;
    }

    if (!isProtected) {
      unblock();
      return;
    }

    // Protected path + not authenticated
    if (status === "unauthenticated" && !wasAuthenticatedRef.current) {
      // Genuinely never authenticated → unblock so the page can redirect to signin
      unblock();
      return;
    }

    // status === "loading", or transient "unauthenticated" after having been
    // authenticated (phone unlock / network hiccup) → block and wait
    block();

    return () => {
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    };
  }, [status, pathname]);

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
