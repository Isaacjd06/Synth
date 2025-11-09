"use client";

import SynthUpdatesCard from "@/components/dashboard/SynthUpdatesCard";
import DashboardLayout from "@/components/layout/DashboardLayout";
// (Optional future import)
// import MemoryActivityCard from "@/components/dashboard/MemoryActivityCard";

export default function DashboardPage() {
  return (
    <DashboardLayout>
      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 min-h-screen pt-[35px] px-[35px] ml-20 mt-16">
        <SynthUpdatesCard />
        {/* <MemoryActivityCard />  ← uncomment once you add it */}
      </div>
    </DashboardLayout>
  );
}
