// src/components/auth/NewPasswordForm.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, EyeIcon, EyeOffIcon } from "lucide-react";
import Link from "next/link";

interface NewPasswordFormProps {
  token: string;
  email: string;
}

export default function NewPasswordForm({ token, email }: NewPasswordFormProps) {
  const router = useRouter();
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate password
    if (!password || !confirmPassword) {
      setErrorMessage("Por favor, complete todos los campos");
      return;
    }
    
    if (password.length < 8) {
      setErrorMessage("La contraseña debe tener al menos 8 caracteres");
      return;
    }
    
    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden");
      return;
    }
    
    setIsSubmitting(true);
    setErrorMessage("");
    
    try {
      const response = await fetch("/api/auth/new-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          email,
          password,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar la contraseña");
      }
      
      setIsSuccess(true);
      
      // Redirect to login page after 3 seconds
      setTimeout(() => {
        router.push("/auth/signin?passwordUpdated=true");
      }, 3000);
      
    } catch (error: any) {
      setErrorMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isSuccess) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-xl">¡Contraseña Actualizada!</CardTitle>
          <CardDescription>
            Su contraseña ha sido cambiada exitosamente
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center py-6">
          <div className="rounded-full bg-green-50 p-3 mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-500" />
          </div>
          <p className="text-center mb-4">
            Su contraseña ha sido actualizada correctamente. Ahora puede iniciar sesión con su nueva contraseña.
          </p>
          <p className="text-sm text-muted-foreground text-center">
            Redirigiendo a la página de inicio de sesión...
          </p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl">Crear Nueva Contraseña</CardTitle>
        <CardDescription>
          Por favor, ingrese y confirme su nueva contraseña
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
            <Label htmlFor="password">Nueva Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isSubmitting}
                className="w-full pr-10"
              />
              <button
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOffIcon className="h-4 w-4" />
                ) : (
                  <EyeIcon className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Mínimo 8 caracteres
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              Actualizando...
            </>
          ) : (
            "Actualizar Contraseña"
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