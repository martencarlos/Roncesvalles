// src/app/unauthorized/page.tsx
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Metadata } from "next";
import { ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Acceso Denegado | Reserva de Espacios Comunitarios",
  description: "No tiene permisos para acceder a esta página",
};

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center">
          <ShieldAlert className="h-16 w-16 text-red-500 mb-4" />
          <h1 className="text-2xl font-bold text-center">Acceso Denegado</h1>
        </div>
        
        <Alert variant="destructive">
          <AlertTitle>No tiene permisos suficientes</AlertTitle>
          <AlertDescription>
            No dispone de los permisos necesarios para acceder a esta página.
            Si cree que esto es un error, contacte con el administrador del sistema.
          </AlertDescription>
        </Alert>
        
        <div className="flex justify-center">
          <Button asChild>
            <Link href="/">Volver al Inicio</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
