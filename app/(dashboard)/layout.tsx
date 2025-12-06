import { ReactNode } from "react";
import Header from "@/components/ui/Header";
import Sidebar from "@/components/ui/Sidebar";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <Sidebar />
      <main className="lg:ml-60 mt-16 min-h-[calc(100vh-4rem)] w-full lg:w-[calc(100%-240px)] overflow-x-hidden">
        <div className="p-4 lg:p-6">
          {children}
        </div>
      </main>
    </>
  );
}

