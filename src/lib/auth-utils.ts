// src/lib/auth-utils.ts
import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { NextRequest } from "next/server";

// Types for extended session user
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      apartmentNumber?: number;
      role: string;
    };
  }

  interface User {
    id: string;
    apartmentNumber?: number;
    role: string;
  }
}

export async function getSession() {
  return await getServerSession(authOptions);
}

export async function getCurrentUser() {
  const session = await getSession();
  
  if (!session?.user?.email) {
    return null;
  }
  
  return session.user;
}

// For protecting API routes - updated version
export async function authenticate(
  req: NextRequest,
  requiredRoles?: string[]
) {
  try {
    // Try to get the session directly from NextAuth instead of making a fetch request
    const session = await getServerSession(authOptions);
    
    console.log("Session data in authenticate:", session ? "Session exists" : "No session found");
    
    if (!session || !session.user) {
      console.log("No valid session found in authenticate");
      return null;
    }
    
    console.log("User from session:", session.user.email, "Role:", session.user.role);
    
    // If specific roles are required, check them
    if (requiredRoles && !requiredRoles.includes(session.user.role)) {
      console.log("User role not in required roles:", session.user.role, "Required:", requiredRoles);
      return null;
    }
    
    return session.user;
  } catch (error) {
    console.error("Error in authenticate function:", error);
    return null;
  }
}