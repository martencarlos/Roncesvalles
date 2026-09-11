// src/app/(protected)/admin/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import Link from "next/link";
import {
  BarChart3,
  Users,
  CalendarDays,
  MessageSquare,
  Download,
  CalendarOff,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Panel de Administración | Reserva de Espacios Comunitarios",
  description: "Panel de administración del sistema de reservas",
};

const sections = [
  {
    href: "/admin/dashboard",
    icon: BarChart3,
    title: "Panel de Estadísticas",
    description:
      "Visualice estadísticas detalladas sobre usuarios, reservas y actividad del sistema con gráficos interactivos.",
    action: "Ver Estadísticas",
    primary: true,
  },
  {
    href: "/admin/users",
    icon: Users,
    title: "Gestión de Usuarios",
    description:
      "Administre los usuarios y sus permisos. Cree cuentas para administradores y usuarios, y gestione sus roles.",
    action: "Gestionar Usuarios",
  },
  {
    href: "/admin/bookings",
    icon: CalendarDays,
    title: "Gestión de Reservas",
    description:
      "Administre todas las reservas. Cree, edite o elimine reservas para cualquier apartamento.",
    action: "Gestionar Reservas",
  },
  {
    href: "/admin/feedback",
    icon: MessageSquare,
    title: "Gestión de Feedback",
    description:
      "Revise y gestione el feedback, reportes de errores y sugerencias enviadas por los usuarios.",
    action: "Gestionar Feedback",
  },
  {
    href: "/admin/export",
    icon: Download,
    title: "Exportar Datos",
    description:
      "Exporte datos de reservas para facturación y gestión administrativa.",
    action: "Exportar Datos",
  },
  {
    href: "/admin/blocked-dates",
    icon: CalendarOff,
    title: "Bloqueos de Fecha",
    description:
      "Bloquee todas las mesas para una fecha por motivo de Junta General Ordinaria o Extraordinaria. Los usuarios no podrán realizar reservas en los turnos bloqueados.",
    action: "Gestionar Bloqueos",
  },
];

export default async function AdminPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin");
  }

  // STRICT CHECK: Only IT Admin allowed
  if (session.user.role !== "it_admin") {
    redirect("/unauthorized");
  }

  return (
    <PageContainer>
      <PageHeader
        title="Panel de Administración"
        description="Gestione las áreas del sistema de reservas."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.href} className="flex flex-col">
              <CardHeader>
                <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </span>
                <CardTitle className="mt-2">{section.title}</CardTitle>
                <CardDescription>{section.description}</CardDescription>
              </CardHeader>
              <CardContent className="mt-auto pt-0">
                <Button
                  asChild
                  variant={section.primary ? "default" : "outline"}
                  className="w-full"
                >
                  <Link href={section.href}>{section.action}</Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </PageContainer>
  );
}
