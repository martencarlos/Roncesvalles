// src/app/auth/new-password/page.tsx
import NewPasswordForm from "@/components/auth/NewPasswordForm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nueva Contraseña | Reserva de Espacios Comunitarios",
  description: "Establezca una nueva contraseña para su cuenta",
};

export default async function NewPasswordPage({
  searchParams,
}: {
  searchParams: { token?: string; email?: string };
}) {
  // Check if user is already authenticated
  const session = await getServerSession(authOptions);
  
  if (session) {
    redirect("/");
  }
  
  // Check if token and email are provided
  const token = searchParams?.token;
  const email = searchParams?.email;
  
  if (!token || !email) {
    redirect("/auth/signin?error=InvalidResetLink");
  }
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Sociedad Roncesvalles</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sistema de Reserva de Espacios Comunitarios
          </p>
        </div>
        
        <NewPasswordForm token={token} email={email} />
      </div>
    </div>
  );
}