// src/app/(protected)/admin/dashboard/page.tsx
import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import UserMenu from "@/components/auth/UserMenu";
import AdminDashboard from "@/components/admin/AdminDashboard";

export const metadata: Metadata = {
  title: "Panel de Estadísticas | Panel de Administración",
  description: "Visualización de estadísticas y métricas del sistema",
};

export default async function AdminDashboardPage() {
  // Check if user is authenticated and has it_admin role
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/dashboard");
  }

  // Only IT admins can access the admin panel
  if (session.user.role !== "it_admin") {
    redirect("/unauthorized");
  }

  return (
    <div className="mx-auto max-w-full px-3 py-2 sm:max-w-6xl sm:px-4 sm:py-3 min-h-[100dvh]">
      <header className="mb-4 sm:mb-6">
        {/* Top row with back button and user menu */}
        <div className="flex justify-between items-center gap-2 mb-3 sm:mb-4">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 px-2 sm:h-9 sm:px-3"
          >
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
              <span className="text-xs sm:text-sm">Volver</span>
            </Link>
          </Button>
          <div className="flex-shrink-0">
            <UserMenu />
          </div>
        </div>

        {/* Title row */}
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">Panel de Estadísticas</h1>
      </header>

      <AdminDashboard />
    </div>
  );
}