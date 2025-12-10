import DashboardStatCard from "./DashboardStatCard";

// Placeholder data - will be replaced with API data
const placeholderStats = {
  activeWorkflows: 12,
  totalExecutions: 2847,
  executionsLast24h: 156,
  successRate: 98.4,
};

const DashboardStatsGrid = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <DashboardStatCard
        title="Active Workflows"
        value={placeholderStats.activeWorkflows}
        trend={{ value: 8, direction: "up" }}
      />
      <DashboardStatCard
        title="Total Executions"
        value={placeholderStats.totalExecutions.toLocaleString()}
        trend={{ value: 12, direction: "up" }}
      />
      <DashboardStatCard
        title="Executions (24h)"
        value={placeholderStats.executionsLast24h}
        trend={{ value: 5, direction: "up" }}
      />
      <DashboardStatCard
        title="Success Rate"
        value={`${placeholderStats.successRate}%`}
        trend={{ value: 2, direction: "up" }}
      />
    </div>
  );
};

export default DashboardStatsGrid;



