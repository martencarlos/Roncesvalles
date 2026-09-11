// src/app/(protected)/admin/bookings/page.tsx
import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import BookingsManagement from "@/components/admin/BookingsManagement";

export const metadata: Metadata = {
  title: "Gestión de Reservas | Panel de Administración",
  description: "Administre las reservas del sistema",
};

export default async function AdminBookingsPage() {
  // Check if user is authenticated and has it_admin role
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/bookings");
  }

  // Only IT admins and Conserje can access the admin panel bookings
  if (session.user.role !== "it_admin" && session.user.role !== "conserje") {
    redirect("/unauthorized");
  }

  // Pass userRole string to component
  return (
    <PageContainer>
      <PageHeader
        title="Gestión de Reservas"
        description="Administre todas las reservas del sistema."
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href="/admin">
              <ArrowLeft />
              Volver al Panel
            </Link>
          </Button>
        }
      />

      <BookingsManagement userRole={session.user.role} />
    </PageContainer>
  );
}
