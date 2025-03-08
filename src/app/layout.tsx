// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import "../styles/datepicker.css"; // Import datepicker styles
import { Toaster } from "sonner";



export const metadata: Metadata = {
  title: "Community Space Booking",
  description: "Book common areas in your apartment building",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className="font-sans antialiased text-primary-background bg-primary-foreground"
      >
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}