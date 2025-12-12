"use client";
import InsightCard, { InsightData } from "./InsightCard";

interface InsightsListProps {
  insights: InsightData[];
}

const InsightsList = ({ insights }: InsightsListProps) => {
  return (
    <div className="flex flex-col gap-3">
      {insights.map((insight) => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
    </div>
  );
};

export default InsightsList;

