"use client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const SkillsLoadingState = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="bg-card/50 border-border/50">
          <CardContent className="p-5 space-y-4">
            {/* Header */}
            <div className="flex items-start justify-between">
              <Skeleton className="w-11 h-11 rounded-xl" />
              <Skeleton className="w-10 h-5 rounded-full" />
            </div>

            {/* Badges */}
            <div className="flex gap-2">
              <Skeleton className="w-16 h-5 rounded-full" />
              <Skeleton className="w-12 h-5 rounded-full" />
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>

            {/* Preview */}
            <Skeleton className="h-12 w-full rounded-lg" />

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Skeleton className="h-8 flex-1 rounded-md" />
              <Skeleton className="h-8 flex-1 rounded-md" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

