// src/components/auth/UserMenu.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { User, LogOut, Settings, ChevronDown, ChevronUp } from "lucide-react";
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
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  if (!session?.user) {
    return (
      <Button variant="outline" onClick={() => router.push("/auth/signin")}>
        <User className="h-4 w-4 mr-2" />
        Iniciar Sesión
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
  
  return (
    <div className="relative" ref={menuRef}>
      <Button 
        variant="outline" 
        className="cursor-pointer flex items-center gap-2"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Avatar className="h-6 w-6">
          <AvatarFallback className="text-xs">
            {getInitials(session.user.name)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden sm:inline text-sm font-normal">
          {session.user.name}
        </span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <div className="px-4 py-2 text-sm font-medium border-b border-gray-100">
              {session.user.role === "user" ? (
                <div className="flex flex-col">
                  <span>{session.user.name}</span>
                  <span className="text-muted-foreground text-xs">
                    Apartamento #{session.user.apartmentNumber}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col">
                  <span>{session.user.name}</span>
                  <span className="text-muted-foreground text-xs capitalize">
                    {session.user.role === "admin" ? "Administrador (Lectura)" : 
                    session.user.role === "manager" ? "Conserje" : 
                    session.user.role === "it_admin" ? "Admin IT" : ""}
                  </span>
                </div>
              )}
            </div>
            
            <Link
              href="/profile"
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
              onClick={() => setIsOpen(false)}
            >
              <div className="flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Perfil
              </div>
            </Link>
            
            <div className="border-t border-gray-100 my-1"></div>
            
            <button
              className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 cursor-pointer disabled:opacity-50"
              disabled={isSigningOut}
              onClick={handleSignOut}
            >
              <div className="flex items-center">
                <LogOut className="h-4 w-4 mr-2" />
                {isSigningOut ? "Cerrando sesión..." : "Cerrar Sesión"}
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}