import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ModuleProvider } from "@/context/ModuleContext";
import { AppShell } from "@/components/layout/AppShell";

export const metadata: Metadata = {
  title: "Haryana Police - Case Management System (CMS)",
  description: "Official Police Station Case & General Diary Management System for Haryana Police",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#081225",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased font-sans selection:bg-[#1e3e62] selection:text-white">
        <AuthProvider>
          <ModuleProvider>
            <AppShell>{children}</AppShell>
          </ModuleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
