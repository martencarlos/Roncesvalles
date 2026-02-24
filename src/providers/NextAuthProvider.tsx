// src/providers/NextAuthProvider.tsx
"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loading } from "@/components/ui/loading";

// Component to handle route transitions during authentication.
// Must not render children while the session is in a transient state —
// on Android Chrome, locking/unlocking causes status to cycle through
// loading → unauthenticated → loading → authenticated, and if children
// render during the unauthenticated moment they trigger redirect loops.
function AuthLoader({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  const wasAuthenticatedRef = useRef(status === "authenticated");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // settled = the session status has durably resolved and children can render.
  const [settled, setSettled] = useState(status === "authenticated");

  useEffect(() => {
    const authSensitivePaths = ['/bookings', '/admin', '/profile', '/activity'];
    const isAuthPath = authSensitivePaths.some(p => pathname.startsWith(p));

    if (status === "authenticated") {
      wasAuthenticatedRef.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      setSettled(true);
      return;
    }

    if (!isAuthPath) {
      // Non-protected routes: always render children immediately.
      if (timerRef.current) clearTimeout(timerRef.current);
      setSettled(true);
      return;
    }

    // On a protected path with non-authenticated status:
    if (status === "unauthenticated" && !wasAuthenticatedRef.current) {
      // Genuine logged-out state (never was authenticated this session).
      if (timerRef.current) clearTimeout(timerRef.current);
      setSettled(true);
      return;
    }

    // status === "loading", or transient "unauthenticated" after being
    // authenticated — hold the loader and wait for status to settle.
    setSettled(false);
    wasAuthenticatedRef.current = false;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setSettled(true), 8000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [status, pathname]);

  if (!settled) {
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