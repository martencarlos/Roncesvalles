// src/app/page.tsx
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function HomePage() {
  // Check if user is authenticated
  const session = await getServerSession(authOptions);
  
  // If not authenticated, redirect to sign in page
  if (!session) {
    redirect("/auth/signin");
  }
  
  // Redirect IT admins directly to admin panel
  if (session.user.role === "it_admin") {
    redirect("/admin");
  }
  
  // For other roles including regular admins (read-only), redirect to bookings page
  redirect("/bookings");
}