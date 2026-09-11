// src/app/(protected)/admin/feedback/page.tsx
import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import FeedbackManagement from "@/components/admin/FeedbackManagement";

export const metadata: Metadata = {
  title: "Gestión de Feedback | Panel de Administración",
  description: "Gestione el feedback de los usuarios del sistema",
};

export default async function AdminFeedbackPage() {
  // Check if user is authenticated and has it_admin role
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/feedback");
  }

  // Only IT admins can access the admin panel
  if (session.user.role !== "it_admin") {
    redirect("/unauthorized");
  }

  return (
    <PageContainer>
      <PageHeader
        title="Gestión de Feedback"
        description="Revise reportes de errores, sugerencias y preguntas."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin">
              <ArrowLeft />
              Volver al Panel
            </Link>
          </Button>
        }
      />

      <FeedbackManagement />
    </PageContainer>
  );
}
