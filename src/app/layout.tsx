// src/app/layout.tsx (updated)
import type { Metadata } from "next";
import "./globals.css";
import "../styles/datepicker.css";
import { Toaster } from "sonner";
import { NextAuthProvider } from "@/providers/NextAuthProvider";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Reserva de Espacios Comunitarios",
  description: "Reserva áreas comunes en tu edificio de apartamentos",
  icons: {
    icon: '/favicon.ico',
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Check authentication status
  const session = await getServerSession(authOptions);
  
  return (
    <html lang="es">
      <body className="relative font-sans antialiased text-primary-background bg-primary-foreground">
        <NextAuthProvider>
          {children}
          <Toaster richColors position="top-right" />
        </NextAuthProvider>
      </body>
    </html>
  );
}
