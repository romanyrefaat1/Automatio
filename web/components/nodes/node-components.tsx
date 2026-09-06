"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useNodeId } from "@xyflow/react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Variable, Hash } from "lucide-react";
import { useAutomationContext } from "@/app/(app-screens)/builder/contexts/AutomationContext";

export const nodeBase =
  "min-w-[260px] max-w-[320px] overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-xs transition-all duration-200 hover:shadow-md hover:border-primary/40";

export const headerBase =
  "flex items-start gap-3 border-b border-border/70 bg-muted/20 px-3.5 py-3";

export const iconBase =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border";

export const contentBase =
  "space-y-2.5 px-3.5 py-3";

export const labelBase =
  "text-[10px] font-semibold uppercase tracking-wider text-muted-foreground";

export const valueBase =
  "truncate rounded-md border border-border/60 bg-muted/40 px-2.5 py-1.5 text-xs text-foreground";

export function NodeCard({
  children,
  selected = false,
  isRunning: explicitIsRunning,
  isCompleted: explicitIsCompleted,
  className,
}: {
  children: ReactNode;
  selected?: boolean;
  isRunning?: boolean;
  isCompleted?: boolean;
  className?: string;
}) {
  const nodeId = useNodeId();

  const {
    activeRun,
    runSteps,
  } = useAutomationContext();

  const runtimeStep = nodeId
    ? runSteps.find(
        (step) => step.step_id === nodeId
      )
    : undefined;

  const derivedIsRunning =
    Boolean(nodeId) &&
    activeRun?.status === "running" &&
    runtimeStep?.status === "running";

  const derivedIsCompleted =
    Boolean(nodeId) &&
    runtimeStep?.status === "completed";

  const isFailed =
    Boolean(nodeId) &&
    runtimeStep?.status === "failed";

  const isRunning =
    explicitIsRunning ?? derivedIsRunning;

  const isCompleted =
    explicitIsCompleted ?? derivedIsCompleted;

  const errorMessage =
    runtimeStep?.error ?? null;

  const [completionKey, setCompletionKey] =
    useState(0);

  const [failureKey, setFailureKey] =
    useState(0);

  const [wasRunning, setWasRunning] =
    useState(false);

  const [wasFailed, setWasFailed] =
    useState(false);

  useEffect(() => {
    if (isRunning) {
      setWasRunning(true);
      return;
    }

    if (wasRunning && isCompleted) {
      setCompletionKey((key) => key + 1);
      setWasRunning(false);
    }
  }, [
    isRunning,
    isCompleted,
    wasRunning,
  ]);

  useEffect(() => {
    if (isRunning) {
      setWasFailed(false);
      return;
    }

    if (isFailed && !wasFailed) {
      setFailureKey((key) => key + 1);
      setWasFailed(true);
    }
  }, [
    isRunning,
    isFailed,
    wasFailed,
  ]);

  return (
    <div className="relative">
      <div
        key={`${completionKey}-${failureKey}`}
        className={cn(
          nodeBase,

          selected &&
            "ring-2 ring-primary border-primary shadow-md",

          isRunning && [
            "relative z-50",
            "border-primary",
            "bg-primary/[0.04]",
            "animate-node-running",
          ],

          isCompleted &&
            !isRunning &&
            "animate-node-complete",

          isFailed && [
            "relative z-40",
            "border-destructive",
            "ring-1 ring-destructive/50",
            "bg-destructive/[0.05]",
            "animate-node-failed",
          ],

          isRunning &&
            !selected &&
            "hover:border-primary",

          className
        )}
      >
        {children}
      </div>

      {isFailed && errorMessage && (
        <div className="mt-2 max-w-[320px] rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-destructive shadow-sm">
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-destructive" />

            <span className="text-[10px] font-bold uppercase tracking-wider">
              Step failed
            </span>
          </div>

          <div className="mt-1.5 break-words text-[11px] leading-relaxed text-destructive/90">
            {errorMessage}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes node-running {
          0%,
          100% {
            box-shadow: 0 0 0 0
              hsl(var(--primary) / 0);
          }

          50% {
            box-shadow: 0 0 18px 2px
              hsl(var(--primary) / 0.28);
          }
        }

        @keyframes node-complete {
          0% {
            transform: scale(1);
          }

          35% {
            transform: scale(1.06);
          }

          70% {
            transform: scale(1.025);
          }

          100% {
            transform: scale(1);
          }
        }

        @keyframes node-failed {
          0%,
          100% {
            transform: translateX(0);
          }

          20% {
            transform: translateX(-3px);
          }

          40% {
            transform: translateX(3px);
          }

          60% {
            transform: translateX(-2px);
          }

          80% {
            transform: translateX(2px);
          }
        }

        .animate-node-running {
          animation: node-running 1.5s ease-in-out infinite;
        }

        .animate-node-complete {
          animation: node-complete 650ms
            cubic-bezier(0.22, 1, 0.36, 1);
        }

        .animate-node-failed {
          animation: node-failed 450ms
            cubic-bezier(0.22, 1, 0.36, 1);
        }
      `}</style>
    </div>
  );
}


export function NodeHeader({
  icon,
  title,
  description,
  typeBadge,
  iconClass = "bg-primary/10 text-primary border-primary/20",
  badgeClass = "border-primary/30 text-primary bg-primary/5",
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  typeBadge?: string;
  iconClass?: string;
  badgeClass?: string;
}) {
  return (
    <div className={headerBase}>
      <div className={cn(iconBase, iconClass)}>
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1.5">
          <div className="truncate text-xs font-bold text-foreground">
            {title}
          </div>

          {typeBadge && (
            <Badge
              variant="outline"
              className={cn(
                "h-4 shrink-0 px-1.5 text-[9px] font-bold uppercase tracking-wider",
                badgeClass
              )}
            >
              {typeBadge}
            </Badge>
          )}
        </div>

        {description && (
          <div className="mt-0.5 truncate text-[11px] text-muted-foreground">
            {description}
          </div>
        )}
      </div>
    </div>
  );
}

export function NodeField({
  label,
  value,
  children,
  className,
}: {
  label: string;
  value?: ReactNode;
  children?: ReactNode;
  className?: string;
}) {
  if (
    value === undefined &&
    children === undefined
  ) {
    return null;
  }

  return (
    <div
      className={cn(
        "space-y-1",
        className
      )}
    >
      <div className={labelBase}>
        {label}
      </div>

      {children ? (
        children
      ) : (
        <div className={valueBase}>
          {value}
        </div>
      )}
    </div>
  );
}

export function NodeCodeField({
  label,
  value,
  placeholder = "Not set",
  prefix,
}: {
  label: string;
  value?: string | number | null;
  placeholder?: string;
  prefix?: ReactNode;
}) {
  const displayVal =
    value !== undefined &&
    value !== null &&
    String(value).trim() !== ""
      ? String(value)
      : null;

  return (
    <div className="space-y-1">
      <div className={labelBase}>
        {label}
      </div>

      <div className="flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2 py-1.5 text-xs font-mono text-foreground">
        {prefix ?? (
          <Hash className="h-3 w-3 shrink-0 text-muted-foreground/70" />
        )}

        <span
          className={cn(
            "truncate",
            !displayVal &&
              "italic text-muted-foreground"
          )}
        >
          {displayVal ?? placeholder}
        </span>
      </div>
    </div>
  );
}

export function NodeBadgeField({
  label,
  badgeText,
  variant = "secondary",
  className,
}: {
  label: string;
  badgeText: string;
  variant?:
    | "default"
    | "secondary"
    | "outline-solid"
    | "destructive";
  className?: string;
}) {
  return (
    <div className="space-y-1">
      <div className={labelBase}>
        {label}
      </div>

      <div>
        <Badge
          variant={variant}
          className={cn(
            "px-2 py-0.5 text-[11px] font-medium",
            className
          )}
        >
          {badgeText}
        </Badge>
      </div>
    </div>
  );
}

export function NodeVariablePill({
  name,
}: {
  name: string;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded border border-primary/30 bg-primary/10 px-1.5 py-0.5 text-[11px] font-mono font-medium text-primary">
      <Variable className="h-3 w-3 shrink-0" />
      {name}
    </span>
  );
}

export function formatConditionValue(
  val?: {
    type?: string;
    selector?: string;
    attribute?: string;
    name?: string;
    value?: string;
  }
): string {
  if (!val || !val.type) {
    return "Not configured";
  }

  switch (val.type) {
    case "static":
      return val.value !== undefined &&
        val.value !== ""
        ? `"${val.value}"`
        : `""`;

    case "variable":
      return val.name
        ? `var(${val.name})`
        : "var(?)";

    case "text":
      return val.selector
        ? `text(${val.selector})`
        : "text(?)";

    case "input_value":
      return val.selector
        ? `val(${val.selector})`
        : "val(?)";

    case "attribute":
      return val.selector &&
        val.attribute
        ? `attr(${val.selector}[${val.attribute}])`
        : "attr(?)";

    case "url":
      return "page.url";

    case "title":
      return "page.title";

    default:
      return (
        val.value ??
        val.name ??
        val.selector ??
        "Value"
      );
  }
}