// src/lib/auth-utils.ts
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "./auth";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

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

// For protecting API routes
export async function authenticate(
  req: NextRequest,
  requiredRoles?: string[]
) {
  const headersList = headers();
  const cookie = headersList.get("cookie") || "";
  
  // Simulate the request with the cookie to get the session
  const res = await fetch(`${process.env.NEXTAUTH_URL}/api/auth/session`, {
    headers: {
      cookie,
    },
  });
  
  const session = await res.json();
  
  if (!session || !session.user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  
  // If specific roles are required, check them
  if (requiredRoles && !requiredRoles.includes(session.user.role)) {
    return NextResponse.json(
      { error: "Forbidden" },
      { status: 403 }
    );
  }
  
  return session.user;
}
