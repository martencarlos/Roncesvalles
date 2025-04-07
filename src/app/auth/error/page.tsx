// src/app/auth/error/page.tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Error de Autenticación | Reserva de Espacios Comunitarios",
  description: "Ha ocurrido un error durante la autenticación",
};

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const error = searchParams?.error || "default";
  
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
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <h1 className="text-2xl font-bold text-center">Error de Autenticación</h1>
        
        <Alert variant="destructive">
          <AlertTitle>{errorMessage}</AlertTitle>
          <AlertDescription>{errorDescription}</AlertDescription>
        </Alert>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild>
            <Link href="/auth/signin">Volver a Iniciar Sesión</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Volver al Inicio</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}