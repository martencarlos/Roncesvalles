// src/app/(protected)/admin/users/page.tsx
import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import UserManagement from "@/components/admin/UserManagement";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";

export const metadata: Metadata = {
  title: "Gestión de Usuarios | Panel de Administración",
  description: "Administre los usuarios del sistema",
};

export default async function AdminUsersPage() {
  // Check if user is authenticated and has it_admin role
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/users");
  }

  // Only IT admins can access the admin panel
  if (session.user.role !== "it_admin") {
    redirect("/unauthorized");
  }

  const isITAdmin = session.user.role === "it_admin";

  return (
    <PageContainer>
      <PageHeader
        title="Gestión de Usuarios"
        description="Administre cuentas, roles y permisos."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin">
              <ArrowLeft />
              Volver al Panel
            </Link>
          </Button>
        }
      />

      <UserManagement isITAdmin={isITAdmin} />
    </PageContainer>
  );
}
