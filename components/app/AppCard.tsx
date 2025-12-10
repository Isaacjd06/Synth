import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface AppCardProps {
  children: ReactNode;
  className?: string;
}

const AppCard = ({ children, className }: AppCardProps) => {
  return (
    <div
      className={cn(
        "bg-card/90 border border-border/60 rounded-lg p-6 shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
};

export default AppCard;



