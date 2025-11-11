"use client";


export default function DashboardPage() {
  return (
    <DashboardLayout>
      {/* Main Dashboard Content - Synth Updates */}
      <div className="min-h-screen pt-[35px] px-[35px] ml-20 mt-16">
        <SynthUpdatesCard />
      </div>
    </DashboardLayout>
  );
}
