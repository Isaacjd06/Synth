import { ReactNode } from "react";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  fullWidth?: boolean;
  fullHeight?: boolean;
}

/**
 * Shared page container component that ensures consistent layout
 * and prevents content from overlapping with sidebar.
 * 
 * - Automatically respects sidebar width on large screens
 * - Handles padding consistently
 * - Prevents horizontal overflow
 * - Works responsively across all viewport sizes
 */
export default function PageContainer({ 
  children, 
  className = "",
  fullWidth = false,
  fullHeight = false 
}: PageContainerProps) {
  const baseClasses = "w-full max-w-full overflow-x-hidden";
  const widthClasses = fullWidth ? "" : "max-w-6xl mx-auto px-2 sm:px-4";
  const heightClasses = fullHeight ? "h-full" : "";
  
  return (
    <div className={`${baseClasses} ${widthClasses} ${heightClasses} ${className}`.trim()}>
      {children}
    </div>
  );
}

