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
        {/* Splash screen: visible immediately via inline CSS before React hydrates.
            Eliminado automáticamente por el script inline de abajo en cuanto el DOM esté listo. */}
        <div
          id="splash-screen"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0f766e',
            gap: '1.5rem',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon-192x192.png"
            alt="Roncesvalles"
            width={96}
            height={96}
            style={{ borderRadius: '1.25rem' }}
          />
          <div
            style={{
              width: '3rem',
              height: '3rem',
              borderRadius: '9999px',
              border: '4px solid rgba(255,255,255,0.3)',
              borderTopColor: '#ffffff',
              animation: 'splash-spin 0.8s linear infinite',
            }}
          />
          <style>{`
            @keyframes splash-spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
        {/* Remove splash screen as soon as React has hydrated the page */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function removeSplash() {
                  var el = document.getElementById('splash-screen');
                  if (el) {
                    el.style.transition = 'opacity 0.3s ease';
                    el.style.opacity = '0';
                    setTimeout(function() { el.remove(); }, 300);
                  }
                }
                if (document.readyState === 'complete') {
                  removeSplash();
                } else {
                  window.addEventListener('load', removeSplash);
                }
              })();
            `,
          }}
        />
        <NextAuthProvider>
          {/* The children will be wrapped with NextAuthProvider, enabling session management */}
          {children}
          <Toaster richColors position="top-right" />
        </NextAuthProvider>
      </body>
    </html>
  );
}