"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface TimelineProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface TimelineItemProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface TimelineHeaderProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

interface TimelineTitleProps
  extends React.HTMLAttributes<HTMLHeadingElement> {
  children: React.ReactNode;
}

interface TimelineContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Timeline = React.forwardRef<HTMLDivElement, TimelineProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("relative", className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Timeline.displayName = "Timeline";

const TimelineItem = React.forwardRef<
  HTMLDivElement,
  TimelineItemProps
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "group relative grid grid-cols-[20px_1fr] gap-x-4 pb-8 last:pb-0",
        className
      )}
      {...props}
    >
      {/* Vertical line */}
      <div className="absolute left-[9px] top-5 bottom-0 w-px bg-border group-last:hidden" />

      {/* Timeline dot */}
      <div className="relative z-10 flex size-5 items-center justify-center">
        <div className="size-2.5 rounded-full border-2 border-primary bg-background ring-4 ring-background" />
      </div>

      <div className="min-w-0">
        {children}
      </div>
    </div>
  );
});

TimelineItem.displayName = "TimelineItem";

const TimelineHeader = React.forwardRef<
  HTMLDivElement,
  TimelineHeaderProps
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("mb-2", className)}
      {...props}
    >
      {children}
    </div>
  );
});

TimelineHeader.displayName = "TimelineHeader";

const TimelineTitle = React.forwardRef<
  HTMLHeadingElement,
  TimelineTitleProps
>(({ className, children, ...props }, ref) => {
  return (
    <h3
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
});

TimelineTitle.displayName = "TimelineTitle";

const TimelineContent = React.forwardRef<
  HTMLDivElement,
  TimelineContentProps
>(({ className, children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "text-sm text-muted-foreground",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

TimelineContent.displayName = "TimelineContent";

export {
  Timeline,
  TimelineItem,
  TimelineHeader,
  TimelineTitle,
  TimelineContent,
};