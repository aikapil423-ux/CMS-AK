import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./court-theme.css";
import { AuthProvider } from "@/context/AuthContext";
import { ModuleProvider } from "@/context/ModuleContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { AppShell } from "@/components/layout/AppShell";
import { GlobalAutoResizeTextareas } from "@/components/ui/auto-resize-textarea";

export const metadata: Metadata = {
  title: "Haryana Police - Case Management System (CMS)",
  description: "Official Police Station Case & General Diary Management System for Haryana Police",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#203c88",
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
      <body className="cms-court-theme min-h-screen bg-white text-slate-800 antialiased font-sans selection:bg-[#203c88] selection:text-white">
        <AuthProvider>
          <ModuleProvider>
            <LanguageProvider>
              <GlobalAutoResizeTextareas />
              <AppShell>{children}</AppShell>
            </LanguageProvider>
          </ModuleProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
