// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import "../styles/datepicker.css"; // Importar estilos del datepicker
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Reserva de Espacios Comunitarios",
  description: "Reserva áreas comunes en tu edificio de apartamentos",
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className="font-sans antialiased text-primary-background bg-primary-foreground"
      >
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}