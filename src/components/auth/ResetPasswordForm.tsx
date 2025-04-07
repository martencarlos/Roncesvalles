// src/components/auth/ResetPasswordForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, Loader2, MailIcon, CheckCircle2, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordForm() {
  const router = useRouter();
  
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [emailDeliveryFailed, setEmailDeliveryFailed] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setErrorMessage("Por favor, ingrese su correo electrónico");
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage("");
    
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Ocurrió un error. Por favor, inténtelo de nuevo.");
      }
      
      // Check if email was actually sent
      if (data.emailSent === false) {
        setEmailDeliveryFailed(true);
      }
      
      // In development environment, log the reset URL if available
      if (process.env.NODE_ENV === "development" && data.resetUrl) {
        console.log("Password reset link:", data.resetUrl);
      }
      
      setIsSubmitted(true);
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isSubmitted) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-xl">Solicitud Enviada</CardTitle>
          <CardDescription>
            Instrucciones enviadas a su correo electrónico
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-6">
          {emailDeliveryFailed ? (
            <>
              <div className="rounded-full bg-amber-50 p-3 mb-4">
                <AlertCircle className="h-8 w-8 text-amber-500" />
              </div>
              <p className="text-center mb-4">
                Hemos procesado su solicitud, pero hubo un problema al enviar el correo electrónico a{" "}
                <span className="font-medium">{email}</span>.
              </p>
              <Alert className="mb-4">
                <AlertDescription>
                  Por favor, contacte al administrador del sistema para recibir ayuda con su contraseña.
                </AlertDescription>
              </Alert>
            </>
          ) : (
            <>
              <div className="rounded-full bg-green-50 p-3 mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-center mb-4">
                Hemos enviado las instrucciones para restablecer su contraseña a{" "}
                <span className="font-medium">{email}</span>.
              </p>
              <p className="text-sm text-muted-foreground text-center">
                Por favor, revise su bandeja de entrada y siga las instrucciones para crear una nueva contraseña.
                Si no recibe el correo en unos minutos, verifique su carpeta de spam.
              </p>
            </>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            asChild 
            variant="outline" 
            className="w-full"
          >
            <Link href="/auth/signin">
              Volver a Iniciar Sesión
            </Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Restablecer Contraseña</CardTitle>
        <CardDescription>
          Ingrese su correo electrónico para recibir instrucciones
        </CardDescription>
      </CardHeader>
      <CardContent>
        {errorMessage && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-muted-foreground">
                <MailIcon className="h-4 w-4" />
              </div>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value.trim())}
                placeholder="correo@ejemplo.com"
                required
                disabled={isSubmitting}
                className="w-full pl-10"
              />
            </div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <InfoIcon className="h-3 w-3 mr-1" />
              Ingrese el correo asociado a su cuenta
            </p>
          </div>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            "Enviar Instrucciones"
          )}
        </Button>
        
        <div className="text-sm text-muted-foreground text-center">
          <Link 
            href="/auth/signin" 
            className="text-blue-600 hover:underline font-medium"
          >
            Volver a Iniciar Sesión
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}