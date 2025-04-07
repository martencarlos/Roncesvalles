// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip authentication for public routes
  if (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/"
  ) {
    return NextResponse.next();
  }
  
  const token = await getToken({ req: request });
  
  // Force users to login if not authenticated
  if (!token) {
    const url = new URL("/auth/signin", request.url);
    url.searchParams.set("callbackUrl", encodeURI(request.url));
    return NextResponse.redirect(url);
  }
  
  // Handle role-specific routes
  if (
    pathname.startsWith("/admin") && 
    token.role !== "admin" && 
    token.role !== "it_admin"
  ) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }
  
  if (
    pathname.startsWith("/manager") && 
    token.role !== "manager" && 
    token.role !== "it_admin"
  ) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};