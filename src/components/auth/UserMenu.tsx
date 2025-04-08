// src/components/auth/UserMenu.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { 
  User, 
  LogOut, 
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function UserMenu() {
  const { data: session } = useSession();
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  // Close the dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    // Close on escape key
    function handleEscapeKey(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscapeKey);
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, []);
  
  if (!session?.user) {
    return (
      <Button 
        variant="outline" 
        onClick={() => router.push("/auth/signin")}
        className="h-8 px-2 sm:h-9 sm:px-3"
      >
        <User className="h-4 w-4 mr-2" />
        <span className="hidden sm:inline">Iniciar Sesión</span>
        <span className="sm:hidden">Entrar</span>
      </Button>
    );
  }
  
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };
  
  const handleSignOut = async () => {
    setIsSigningOut(true);
    await signOut({ redirect: true, callbackUrl: "/" });
  };
  
  // Helper function to get role display name
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrador (Lectura)";
      case "it_admin":
        return "Admin IT";
      case "manager":
        return "Conserje";
      default:
        return role;
    }
  };
  
  return (
    <div ref={menuRef} className="relative z-10">
      {/* User Button */}
      <Button 
        variant="outline" 
        className="cursor-pointer h-8 px-2 sm:h-9 sm:px-3"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Avatar className="h-6 w-6">
          <AvatarFallback className="text-xs bg-primary text-primary-foreground">
            {getInitials(session.user.name)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden sm:inline ml-2 text-sm">
          {session.user.name.split(' ')[0]}
        </span>
      </Button>
      
      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1 w-56 rounded-md shadow-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium truncate">{session.user.name}</p>
            {session.user.role === "user" ? (
              <p className="text-xs text-muted-foreground mt-0.5">
                Apartamento #{session.user.apartmentNumber}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground mt-0.5 capitalize">
                {getRoleDisplay(session.user.role)}
              </p>
            )}
          </div>
          
          {/* Menu Items */}
          <div className="py-1">
            <Link
              href="/profile"
              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>Perfil</span>
            </Link>
            
            <button
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSigningOut}
              onClick={handleSignOut}
            >
              <LogOut className="h-4 w-4 mr-2 flex-shrink-0" />
              <span>{isSigningOut ? "Cerrando sesión..." : "Cerrar Sesión"}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}