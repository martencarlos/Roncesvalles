// src/providers/NextAuthProvider.tsx
"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Loading } from "@/components/ui/loading";

// Component to handle route transitions during authentication
function AuthLoader({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  
  // Show loading state during authentication transitions
  useEffect(() => {
    // Only handle specific paths where authentication status matters
    const authSensitivePaths = ['/bookings', '/admin', '/profile', '/activity'];
    const isAuthPath = authSensitivePaths.some(path => pathname.startsWith(path));
    
    if (status === 'loading' && isAuthPath) {
      setIsLoading(true);
    } else {
      // Add slight delay before hiding loader to ensure smooth transition
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [status, pathname]);
  
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