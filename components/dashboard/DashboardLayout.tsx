import { ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="w-full max-w-full overflow-x-hidden px-4 lg:px-6 py-4 lg:py-6">
      {children}
    </div>
  );
}

