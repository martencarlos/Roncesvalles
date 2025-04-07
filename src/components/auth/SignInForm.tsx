// src/components/auth/SignInForm.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon, Loader2 } from "lucide-react";
import Link from "next/link";

export default function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  
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
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (error) {
      setErrorMessage("Error al iniciar sesión. Inténtelo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
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
                : errorMessage || "Error al iniciar sesión"}
            </AlertDescription>
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
              Iniciando sesión...
            </>
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