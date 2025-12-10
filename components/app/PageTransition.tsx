"use client";
import { motion } from "framer-motion";
import { ReactNode, createContext, useContext, useMemo, useState, useEffect } from "react";
import { usePathname } from "next/navigation"

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.1,
    },
  },
};

// Use opacity + scale animations (no translateY to prevent scroll issues)
const itemVariants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94] as const,
    },
  },
};

// Track visited pages globally - persists across component remounts and navigation
const visitedPages = new Set<string>();

// Context to pass animation state to children
const PageAnimationContext = createContext<boolean>(false);

export const PageTransition = ({ children, className }: PageTransitionProps) => {
  const pathname = usePathname();
  const currentPath = pathname || "";
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Determine if we should animate - only on first visit to this path and after mounted
  const shouldAnimate = useMemo(() => {
    if (!isMounted || visitedPages.has(currentPath)) {
      return false;
    }
    // Mark as visited immediately
    visitedPages.add(currentPath);
    return true;
  }, [currentPath, isMounted]);

  // Provide animation state to children via context
  return (
    <PageAnimationContext.Provider value={shouldAnimate}>
      {shouldAnimate ? (
        <motion.div
          key={currentPath}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={className}
        >
          {children}
        </motion.div>
      ) : (
        <div className={className}>{children}</div>
      )}
    </PageAnimationContext.Provider>
  );
};

export const PageItem = ({ children, className }: PageTransitionProps) => {
  // Get animation state from parent PageTransition
  const shouldAnimate = useContext(PageAnimationContext);

  if (!shouldAnimate) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div variants={itemVariants} className={className}>
      {children}
    </motion.div>
  );
};

// Export for external use
export { containerVariants, itemVariants, visitedPages };



