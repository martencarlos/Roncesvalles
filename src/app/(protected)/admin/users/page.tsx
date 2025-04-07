// src/app/(protected)/admin/users/page.tsx
import { Metadata } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import UserManagement from "@/components/admin/UserManagement";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Gestión de Usuarios | Panel de Administración",
  description: "Administre los usuarios del sistema",
};

export default async function AdminUsersPage() {
  // Check if user is authenticated and has admin/it_admin role
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/auth/signin?callbackUrl=/admin/users");
  }
  
  if (session.user.role !== "admin" && session.user.role !== "it_admin") {
    redirect("/unauthorized");
  }
  
  const isITAdmin = session.user.role === "it_admin";
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-3 sm:p-4 min-h-screen">
      <header className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
          <h1 className="text-2xl sm:text-3xl font-bold">Gestión de Usuarios</h1>
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Panel
            </Link>
          </Button>
        </div>
      </header>
      
      <UserManagement isITAdmin={isITAdmin} />
    </div>
  );
}