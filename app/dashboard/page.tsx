"use client";

import { DashboardGrid } from "@/components/dashboard/DashboardGrid";
import DashboardLayout from "@/components/layout/DashboardLayout";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      {/* Main Dashboard Content */}
      <DashboardGrid />
    </DashboardLayout>
  );
}
