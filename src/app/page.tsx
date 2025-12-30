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
  
  // Redirect ONLY IT admins to admin panel
  if (session.user.role === "it_admin") {
    redirect("/admin");
  }
  
  // Conserje, Admin (read-only), and User go to bookings
  redirect("/bookings");
}