// src/components/auth/SignInForm.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");
  const passwordUpdated = searchParams.get("passwordUpdated");
  const registered = searchParams.get("registered");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  useEffect(() => {
    if (passwordUpdated === "true") {
      setSuccessMessage("Su contraseña ha sido actualizada correctamente. Por favor, inicie sesión con su nueva contraseña.");
    } else if (registered === "true") {
      setSuccessMessage("Su cuenta ha sido creada correctamente. Por favor, inicie sesión.");
    }
  }, [passwordUpdated, registered]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setErrorMessage("Por favor, complete todos los campos");
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage("");
    
    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
      });
      
      if (result?.error) {
        setErrorMessage("Credenciales inválidas");
        setIsSubmitting(false);
      } else {
        setIsRedirecting(true);
        // Show loading state for at least 500ms to ensure user sees feedback
        setTimeout(() => {
          router.push(callbackUrl);
          router.refresh();
        }, 500);
      }
    } catch (error) {
      setErrorMessage("Error al iniciar sesión. Inténtelo de nuevo.");
      setIsSubmitting(false);
    }
  };
  
  // If we're redirecting, show a full-page loader
  if (isRedirecting) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background z-50">
        <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4"></div>
        <p className="text-lg font-medium text-foreground">Iniciando sesión...</p>
        <p className="text-sm text-muted-foreground mt-2">Redirigiendo a su cuenta</p>
      </div>
    );
  }
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Iniciar Sesión</CardTitle>
        <CardDescription>
          Ingrese a su cuenta para acceder a las reservas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {(error || errorMessage) && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>
              {error === "CredentialsSignin" 
                ? "Credenciales inválidas" 
                : error === "InvalidResetLink"
                ? "El enlace de restablecimiento es inválido o ha expirado"
                : errorMessage || "Error al iniciar sesión"}
            </AlertDescription>
          </Alert>
        )}
        
        {successMessage && (
          <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
            <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
              placeholder="correo@ejemplo.com"
              required
              disabled={isSubmitting}
              className="w-full"
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="password">Contraseña</Label>
              <Link 
                href="/auth/reset-password" 
                className="text-xs text-blue-600 hover:underline"
                tabIndex={-1}
              >
                ¿Olvidó su contraseña?
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              disabled={isSubmitting}
              className="w-full"
            />
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full hidden"
          >
            Iniciar Sesión
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full relative"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Iniciando sesión...
            </span>
          ) : (
            "Iniciar Sesión"
          )}
        </Button>
        
        <div className="text-sm text-muted-foreground text-center">
          ¿No tiene una cuenta?{" "}
          <Link 
            href="/auth/signup" 
            className="text-blue-600 hover:underline font-medium"
          >
            Crear cuenta
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}