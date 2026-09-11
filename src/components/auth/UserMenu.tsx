// src/components/auth/UserMenu.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { signOut, useSession } from "next-auth/react";
import { User, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import PushNotificationManager from "@/components/auth/PushNotificationManager";

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
      if (event.key === "Escape") {
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
        size="sm"
        onClick={() => router.push("/auth/signin")}
      >
        <User className="h-4 w-4" />
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
      case "conserje":
        return "Conserjería";
      default:
        return role;
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <PushNotificationManager />
      <div ref={menuRef} className="relative z-10">
        {/* User Button */}
        <Button
          variant="ghost"
          className="h-9 gap-2 px-1.5 sm:pr-3"
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="menu"
          aria-expanded={isOpen}
        >
          <Avatar className="size-6">
            <AvatarFallback className="bg-primary text-[10px] font-semibold text-primary-foreground">
              {getInitials(session.user.name)}
            </AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium sm:inline">
            {session.user.name.split(" ")[0]}
          </span>
        </Button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div
            role="menu"
            className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-popover shadow-lg"
          >
            {/* User Info */}
            <div className="border-b border-border px-4 py-3">
              <p className="truncate text-sm font-medium">
                {session.user.name}
              </p>
              {session.user.role === "user" ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {(() => {
                    const num = session.user.apartmentNumber;
                    if (num == null) return "Apartamento #—"; // fallback if undefined or null

                    let label = `Apartamento #${num}`;
                    if (num >= 43 && num <= 48) {
                      const level = num - 42; // 43→1, 44→2, …, 48→6
                      label += ` (L${level})`;
                    }

                    return label;
                  })()}
                </p>
              ) : (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {getRoleDisplay(session.user.role)}
                </p>
              )}
            </div>

            {/* Menu Items */}
            <div className="p-1">
              <Link
                href="/profile"
                role="menuitem"
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-accent focus-visible:bg-accent focus-visible:outline-none"
                onClick={() => setIsOpen(false)}
              >
                <Settings className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span>Perfil</span>
              </Link>

              <button
                role="menuitem"
                className={cn(
                  "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-destructive transition-colors hover:bg-destructive/10 focus-visible:bg-destructive/10 focus-visible:outline-none",
                  "disabled:cursor-not-allowed disabled:opacity-50"
                )}
                disabled={isSigningOut}
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4 shrink-0" />
                <span>
                  {isSigningOut ? "Cerrando sesión..." : "Cerrar Sesión"}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
