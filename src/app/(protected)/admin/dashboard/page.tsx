// src/app/(protected)/admin/dashboard/page.tsx
import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
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
    <PageContainer>
      <PageHeader
        title="Panel de Estadísticas"
        description="Métricas de usuarios, reservas y actividad del sistema."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin">
              <ArrowLeft />
              Volver
            </Link>
          </Button>
        }
      />

      <AdminDashboard />
    </PageContainer>
  );
}
