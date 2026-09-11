// src/app/auth/error/page.tsx
import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Error de Autenticación | Reserva de Espacios Comunitarios",
  description: "Ha ocurrido un error durante la autenticación",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error = "default" } = await searchParams;
  
  let errorMessage = "Ha ocurrido un error durante la autenticación.";
  let errorDescription = "Por favor, inténtelo de nuevo más tarde.";
  
  switch (error) {
    case "CredentialsSignin":
      errorMessage = "Credenciales inválidas";
      errorDescription = "El correo electrónico o la contraseña son incorrectos.";
      break;
    case "SessionRequired":
      errorMessage = "Se requiere iniciar sesión";
      errorDescription = "Debe iniciar sesión para acceder a esta página.";
      break;
    case "AccessDenied":
      errorMessage = "Acceso denegado";
      errorDescription = "No tiene permiso para acceder a esta página.";
      break;
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
        <h1 className="mt-4 text-xl font-semibold">Error de Autenticación</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sistema de Reserva de Espacios Comunitarios
        </p>
      </div>

      <Card className="w-full max-w-md">
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>{errorMessage}</AlertTitle>
            <AlertDescription>{errorDescription}</AlertDescription>
          </Alert>
        </CardContent>
        <CardFooter className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/auth/signin">Volver a Iniciar Sesión</Link>
          </Button>
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/">Volver al Inicio</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}