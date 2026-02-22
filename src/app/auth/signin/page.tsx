// src/app/auth/signin/page.tsx
import Image from "next/image";
import SignInForm from "@/components/auth/SignInForm";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Iniciar Sesión | Reserva de Espacios Comunitarios",
  description: "Acceda a su cuenta para gestionar reservas de espacios comunitarios",
};

export default async function SignInPage() {
  // Check if user is already authenticated
  const session = await getServerSession(authOptions);
  
  if (session) {
    redirect("/");
  }
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <Image src="/icon-192x192.png" alt="Roncesvalles" width={80} height={80} className="rounded-2xl" />
          </div>
          <h1 className="text-3xl font-bold">Sociedad Roncesvalles</h1>
          <p className="mt-2 text-sm text-gray-600">
            Sistema de Reserva de Espacios Comunitarios
          </p>
        </div>
        
        <SignInForm />
      </div>
    </div>
  );
}