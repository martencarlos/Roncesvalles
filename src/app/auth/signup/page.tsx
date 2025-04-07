// src/app/auth/signup/page.tsx
import SignUpForm from "@/components/auth/SignUpForm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crear Cuenta | Reserva de Espacios Comunitarios",
  description: "Regístrese para acceder al sistema de reservas de espacios comunitarios",
};

export default async function SignUpPage() {
  // Check if user is already authenticated
  const session = await getServerSession(authOptions);
  
  if (session) {
    redirect("/");
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
        
        <SignUpForm />
      </div>
    </div>
  );
}