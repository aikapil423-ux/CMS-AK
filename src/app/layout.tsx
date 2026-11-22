import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./court-theme.css";
import "./premium-ui.css";
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
  maximumScale: 5,
  userScalable: true,
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
        {/*
          `crypto.randomUUID()` only exists in secure contexts (HTTPS or localhost).
          The CMS also runs on plain-HTTP station intranets, where every id generated
          with it threw "crypto.randomUUID is not a function" and blocked complaint/FIR
          submission. Polyfill it before any app code runs so ids keep working there.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{if(typeof crypto==="undefined"||typeof crypto.randomUUID==="function")return;var f=function(){var b=new Uint8Array(16);if(crypto.getRandomValues){crypto.getRandomValues(b);}else{for(var i=0;i<16;i++)b[i]=Math.floor(Math.random()*256);}b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;var h="";for(var j=0;j<16;j++)h+=(b[j]+256).toString(16).slice(1);return h.slice(0,8)+"-"+h.slice(8,12)+"-"+h.slice(12,16)+"-"+h.slice(16,20)+"-"+h.slice(20);};Object.defineProperty(crypto,"randomUUID",{value:f,configurable:true,writable:true});}catch(e){}})();`,
          }}
        />
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
