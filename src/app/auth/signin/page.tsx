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
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-muted/40 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-col items-center text-center">
        <Image
          src="/icon-192x192.png"
          alt="Roncesvalles"
          width={56}
          height={56}
          className="rounded-2xl"
        />
        <h1 className="mt-4 text-xl font-semibold">Sociedad Roncesvalles</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sistema de Reserva de Espacios Comunitarios
        </p>
      </div>

      <div className="w-full max-w-md">
        <SignInForm />
      </div>
    </div>
  );
}