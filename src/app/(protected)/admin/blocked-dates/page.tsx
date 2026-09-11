// src/app/(protected)/admin/blocked-dates/page.tsx
import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import BlockedDatesManagement from "@/components/admin/BlockedDatesManagement";

export const metadata: Metadata = {
  title: "Bloqueos de Fecha | Panel de Administración",
  description: "Gestione los bloqueos de fecha por juntas generales",
};

export default async function AdminBlockedDatesPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/blocked-dates");
  }

  if (session.user.role !== "it_admin") {
    redirect("/unauthorized");
  }

  return (
    <PageContainer>
      <PageHeader
        title="Bloqueos de Fecha"
        description="Bloquee turnos por Junta General Ordinaria o Extraordinaria."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin">
              <ArrowLeft />
              Volver al Panel
            </Link>
          </Button>
        }
      />

      <BlockedDatesManagement />
    </PageContainer>
  );
}
