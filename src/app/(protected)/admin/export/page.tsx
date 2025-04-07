// src/app/(protected)/admin/export/page.tsx
import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import UserMenu from "@/components/auth/UserMenu";
import ExportDataPanel from "@/components/admin/ExportDataPanel";

export const metadata: Metadata = {
  title: "Exportar Datos | Panel de Administración",
  description: "Exporte datos de reservas para facturación y gestión administrativa",
};

export default async function AdminExportPage() {
  // Check if user is authenticated and has it_admin role
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/export");
  }

  // Only IT admins can access the admin panel
  if (session.user.role !== "it_admin") {
    redirect("/unauthorized");
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-3 sm:p-4 min-h-screen">
      <header className="mb-6">
        {/* Top row with back button and user menu */}
        <div className="flex justify-between items-center gap-2 mb-4">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-8 px-2 sm:h-9 sm:px-3"
          >
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Volver al Panel</span>
              <span className="sm:hidden">Volver</span>
            </Link>
          </Button>
          <div className="flex-shrink-0">
            <UserMenu />
          </div>
        </div>

        {/* Title row */}
        <h1 className="text-2xl sm:text-3xl font-bold">Exportar Datos</h1>
      </header>

      <ExportDataPanel />
    </div>
  );
}