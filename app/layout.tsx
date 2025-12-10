import "./globals.css";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Providers } from "./providers";

const inter = Inter({ subsets: ["latin"] });
const plusJakartaSans = Plus_Jakarta_Sans({ 
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
});

export const metadata = {
  title: "Synth",
  description: "Synth AI - Workflow Automation Platform",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="overflow-x-hidden">
      <body className={`${inter.className} ${plusJakartaSans.variable} overflow-x-hidden`}>
        <Providers>
          {children}
          <Toaster position="top-right" richColors />
          <Sonner />
        </Providers>
      </body>
    </html>
  );
}
