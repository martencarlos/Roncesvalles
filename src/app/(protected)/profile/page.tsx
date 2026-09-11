// src/app/profile/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import UserProfileForm from "@/components/auth/UserProfileForm";
import { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/layout/PageShell";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Perfil de Usuario | Reserva de Espacios Comunitarios",
  description: "Gestione su perfil de usuario",
};

export default async function ProfilePage() {
  // Check if user is authenticated
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin?callbackUrl=/profile");
  }

  // Determine back button properties based on role
  let backUrl: string;
  let backText: string;

  if (session.user.role === 'it_admin') {
    // For IT Admins, link back to the admin panel
    backUrl = "/admin";
    backText = "Volver al Panel";
  } else {
    // For all other roles (user, admin (read-only)), link back to the bookings page
    // Linking to /bookings is more explicit than '/' which relies on redirection logic.
    backUrl = "/bookings";
    backText = "Volver a Reservas";
  }

  return (
    <PageContainer className="max-w-2xl">
      <PageHeader
        title="Perfil de Usuario"
        description="Gestione su información personal y su contraseña"
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={backUrl}>
              <ArrowLeft className="h-4 w-4" />
              {backText}
            </Link>
          </Button>
        }
      />

      <UserProfileForm />
    </PageContainer>
  );
}