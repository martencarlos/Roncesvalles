// src/providers/NextAuthProvider.tsx
"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loading } from "@/components/ui/loading";

// Component to handle route transitions during authentication
function AuthLoader({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  // When true, the safety valve has fired and we must not re-enable the spinner
  // until the next genuine navigation (pathname change).
  const suppressedRef = useRef(false);
  const prevPathnameRef = useRef(pathname);

  // Reset suppression on navigation so the loader can work normally on new routes.
  useEffect(() => {
    if (pathname !== prevPathnameRef.current) {
      suppressedRef.current = false;
      prevPathnameRef.current = pathname;
    }
  }, [pathname]);

  // Show loading state during authentication transitions
  useEffect(() => {
    // Only handle specific paths where authentication status matters
    const authSensitivePaths = ['/bookings', '/admin', '/profile', '/activity'];
    const isAuthPath = authSensitivePaths.some(path => pathname.startsWith(path));

    if (status === 'loading' && isAuthPath && !suppressedRef.current) {
      setIsLoading(true);
    } else {
      // Add slight delay before hiding loader to ensure smooth transition
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [status, pathname]);

  // Safety valve: if loading gets stuck (e.g. Android Chrome tab resume),
  // force-clear after 8 seconds.
  // Do NOT suppress on visibilitychange — on Android resume the session
  // fetch may still be in-flight, and clearing the loader early causes pages
  // to briefly see status='unauthenticated' and redirect to sign-in.
  useEffect(() => {
    if (!isLoading) return;

    const suppress = () => {
      suppressedRef.current = true;
      setIsLoading(false);
    };

    const maxWait = setTimeout(suppress, 8000);

    return () => {
      clearTimeout(maxWait);
    };
  }, [isLoading]);

  if (isLoading) {
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