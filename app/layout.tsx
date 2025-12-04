import "./globals.css";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import Header from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "Synth",
  description: "Synth AI - Workflow Automation Platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        <Sidebar />
        <main className="ml-60 mt-16 p-6 min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
