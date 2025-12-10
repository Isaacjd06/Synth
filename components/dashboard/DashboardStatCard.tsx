import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface DashboardStatCardProps {
  title: string;
  value: string | number;
  trend?: {
    value: number;
    direction: "up" | "down";
  };
  className?: string;
}

const DashboardStatCard = ({ title, value, trend, className }: DashboardStatCardProps) => {
  return (
    <Card className={cn(
      "bg-card border-border/50 p-5 transition-all duration-300 hover:border-primary/30",
      className
    )}>
      <p className="text-sm text-muted-foreground mb-1">{title}</p>
      <p className="text-3xl font-bold text-foreground">{value}</p>
      {trend && (
        <div className={cn(
          "flex items-center gap-1 mt-2 text-xs",
          trend.direction === "up" ? "text-green-400" : "text-red-400"
        )}>
          {trend.direction === "up" ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          <span>{trend.value}% from last week</span>
        </div>
      )}
    </Card>
  );
};

export default DashboardStatCard;



