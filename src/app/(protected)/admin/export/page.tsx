// src/app/(protected)/admin/export/page.tsx
import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import ExportDataPanel from "@/components/admin/ExportDataPanel";

export const metadata: Metadata = {
  title: "Exportar Datos | Panel de Administración",
  description: "Exporte datos de reservas para facturación y gestión administrativa",
};

export default async function AdminExportPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/export");
  }

  if (!["admin", "conserje", "it_admin"].includes(session.user.role)) {
    redirect("/unauthorized");
  }

  const backHref = session.user.role === "it_admin" ? "/admin" : "/bookings";

  return (
    <PageContainer>
      <PageHeader
        title="Exportar Datos"
        description="Genere exportes de reservas y usuarios para facturación."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={backHref}>
              <ArrowLeft />
              {session.user.role === "it_admin"
                ? "Volver al Panel"
                : "Volver a Reservas"}
            </Link>
          </Button>
        }
      />

      <ExportDataPanel userRole={session.user.role} />
    </PageContainer>
  );
}
