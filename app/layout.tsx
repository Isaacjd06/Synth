import "./globals.css";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import Header from "@/components/ui/Header";
import AppShell from "@/components/layout/AppShell";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Synth",
  description: "Synth AI - Workflow Automation Platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body className={inter.className + " overflow-x-hidden"}>
        <Header />
        <AppShell>
          {children}
        </AppShell>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
