// src/app/(protected)/admin/page.tsx (updated)
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import UserMenu from "@/components/auth/UserMenu";

export const metadata: Metadata = {
  title: "Panel de Administración | Reserva de Espacios Comunitarios",
  description: "Panel de administración del sistema de reservas",
};

// Updated section for src/app/(protected)/admin/page.tsx
export default async function AdminPage() {
  // Check if user is authenticated and has it_admin role
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin");
  }

  // Only IT admins can access the admin panel
  if (session.user.role !== "it_admin") {
    redirect("/unauthorized");
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-3 sm:p-4 min-h-screen">
      <header className="mb-6">
        <div className="flex justify-between items-center gap-2 mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold truncate">
            Panel de Administración
          </h1>
          <div className="flex-shrink-0">
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Dashboard Card */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Panel de Estadísticas</h2>
          <p className="text-muted-foreground mb-4">
            Visualice estadísticas detalladas sobre usuarios, reservas y
            actividad del sistema con gráficos interactivos.
          </p>
          <Button asChild className="w-full">
            <Link href="/admin/dashboard">Ver Estadísticas</Link>
          </Button>
        </div>

        {/* User Management Card */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Gestión de Usuarios</h2>
          <p className="text-muted-foreground mb-4">
            Administre los usuarios y sus permisos. Cree cuentas para
            administradores y conserjes.
          </p>
          <Button asChild className="w-full">
            <Link href="/admin/users">Gestionar Usuarios</Link>
          </Button>
        </div>

        {/* Bookings Management Card */}
        <div className="bg-white rounded-lg border shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Gestión de Reservas</h2>
          <p className="text-muted-foreground mb-4">
            Administre todas las reservas. Cree, edite o elimine reservas para
            cualquier apartamento.
          </p>
          <Button asChild className="w-full">
            <Link href="/admin/bookings">Gestionar Reservas</Link>
          </Button>
        </div>

        {/* Feedback Management Card - NEW */}
        <div
          className="bg-white rounded-lg border shadow-sm p-6"
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <h2 className="text-xl font-semibold mb-4">Gestión de Feedback</h2>
          <p className="text-muted-foreground mb-4">
            Revise y gestione el feedback, reportes de errores y sugerencias
            enviadas por los usuarios.
          </p>
          <Button asChild className="w-full">
            <Link href="/admin/feedback">Gestionar Feedback</Link>
          </Button>
        </div>

        {/* Export Data Card */}
        <div
          className="bg-white rounded-lg border shadow-sm p-6"
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <h2 className="text-xl font-semibold mb-4">Exportar Datos</h2>
          <p className="text-muted-foreground mb-4">
            Exporte datos de reservas para facturación y gestión administrativa.
          </p>
          <Button asChild className="w-full">
            <Link href="/admin/export">Exportar Datos</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
