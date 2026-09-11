// src/app/unauthorized/page.tsx
import Image from "next/image";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Metadata } from "next";
import { ShieldAlert } from "lucide-react";

export const metadata: Metadata = {
  title: "Acceso Denegado | Reserva de Espacios Comunitarios",
  description: "No tiene permisos para acceder a esta página",
};

export default function UnauthorizedPage() {
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
        <h1 className="mt-4 text-xl font-semibold">Acceso Denegado</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          No tiene permisos para acceder a esta página
        </p>
      </div>

      <Card className="w-full max-w-md">
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <span className="grid size-11 place-items-center rounded-full bg-destructive/10 text-destructive">
              <ShieldAlert className="size-5" />
            </span>
          </div>

          <Alert variant="destructive">
            <AlertTitle>No tiene permisos suficientes</AlertTitle>
            <AlertDescription>
              No dispone de los permisos necesarios para acceder a esta página.
              Si cree que esto es un error, contacte con el administrador del
              sistema.
            </AlertDescription>
          </Alert>

          <Button asChild className="w-full">
            <Link href="/">Volver al Inicio</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
