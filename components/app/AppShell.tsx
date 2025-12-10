import { ReactNode } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

interface AppShellProps {
  children: ReactNode;
}

const AppShell = ({ children }: AppShellProps) => {
  return (
    <div className="min-h-screen bg-background relative">
      {/* Background ambient effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Top-left glow */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        {/* Bottom-right glow */}
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 grid-computation opacity-30" />
      </div>
      
      <Header />
      <Sidebar />
      <main className="lg:ml-60 mt-16 min-h-[calc(100vh-4rem)] lg:w-[calc(100%-240px)] overflow-x-hidden relative">
        {children}
      </main>
    </div>
  );
};

export default AppShell;


