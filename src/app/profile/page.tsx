// src/app/profile/page.tsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import UserProfileForm from "@/components/auth/UserProfileForm";
import { Metadata } from "next";
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
  
  return (
    <div className="max-w-4xl mx-auto px-4 py-3 sm:p-4 min-h-screen">
      <header className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Perfil de Usuario</h1>
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
            <Link href="/">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver a Reservas
            </Link>
          </Button>
        </div>
      </header>
      
      <div className="mt-8">
        <UserProfileForm />
      </div>
    </div>
  );
}