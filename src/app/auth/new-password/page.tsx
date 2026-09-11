// src/app/auth/new-password/page.tsx
import Image from "next/image";
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
  searchParams: Promise<{ token?: string; email?: string }>;
}) {
  // Check if user is already authenticated
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/");
  }

  // Check if token and email are provided
  const { token, email } = await searchParams;
  
  if (!token || !email) {
    redirect("/auth/signin?error=InvalidResetLink");
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
        <NewPasswordForm token={token} email={email} />
      </div>
    </div>
  );
}