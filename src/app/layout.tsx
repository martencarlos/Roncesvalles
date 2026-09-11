// src/app/layout.tsx
import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import "../styles/datepicker.css";
import { Toaster } from "sonner";
import { NextAuthProvider } from "@/providers/NextAuthProvider";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap",
});

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#0f766e' },
    { media: '(prefers-color-scheme: dark)', color: '#0f766e' },
  ],
};

export const metadata: Metadata = {
  title: "Reserva de Espacios Comunitarios",
  description: "Reserva áreas comunes en tu edificio de apartamentos",
  manifest: '/manifest.webmanifest',
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
  await getServerSession(authOptions);
  
  return (
    <html lang="es">
      <body
        className={`${geist.variable} font-sans antialiased text-foreground bg-background`}
      >
        <NextAuthProvider>
          {/* The children will be wrapped with NextAuthProvider, enabling session management */}
          {children}
          <Toaster
            richColors
            position="top-right"
            toastOptions={{
              classNames: {
                toast:
                  "rounded-lg border border-border shadow-sm text-sm",
              },
            }}
          />
        </NextAuthProvider>
      </body>
    </html>
  );
}