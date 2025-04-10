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
  
  // Redirect IT admin to admin panel after login if trying to access bookings
  if (token.role === "it_admin" && pathname.startsWith("/bookings")) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }
  
  // Handle role-specific routes access
  if (pathname.startsWith("/admin")) {
    // Only IT admins can access admin panel
    if (token.role !== "it_admin") {
      return NextResponse.redirect(new URL("/unauthorized", request.url));
    }
  }
  
  // Admin (read-only) role should not be able to access admin panel
  if (token.role === "admin" && pathname.startsWith("/admin")) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }
  
  
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};