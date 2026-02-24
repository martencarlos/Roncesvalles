// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import "../styles/datepicker.css";
import { Toaster } from "sonner";
import { NextAuthProvider } from "@/providers/NextAuthProvider";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Reserva de Espacios Comunitarios",
  description: "Reserva áreas comunes en tu edificio de apartamentos",
  manifest: '/manifest.webmanifest',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0f766e' },
    { media: '(prefers-color-scheme: dark)', color: '#0f766e' },
  ],
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Roncesvalles',
  },
  icons: {
    icon: [
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
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
          {/* The children will be wrapped with NextAuthProvider, enabling session management */}
          {children}
          <Toaster richColors position="top-right" />
        </NextAuthProvider>
      </body>
    </html>
  );
}