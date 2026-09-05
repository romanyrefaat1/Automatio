/* web/components/nodes/node-components.tsx */
"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Code, Variable, Hash } from "lucide-react";

export const nodeBase =
  "min-w-[260px] max-w-[320px] overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm transition-all hover:shadow-md hover:border-primary/40";

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
  className,
}: {
  children: ReactNode;
  selected?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        nodeBase,
        selected && "ring-2 ring-primary border-primary shadow-md",
        className
      )}
    >
      {children}
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
                "h-4 px-1.5 text-[9px] font-bold uppercase tracking-wider shrink-0",
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
  if (value === undefined && children === undefined) {
    return null;
  }

  return (
    <div className={cn("space-y-1", className)}>
      <div className={labelBase}>{label}</div>
      {children ? children : <div className={valueBase}>{value}</div>}
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
  const displayVal = value !== undefined && value !== null && String(value).trim() !== ""
    ? String(value)
    : null;

  return (
    <div className="space-y-1">
      <div className={labelBase}>{label}</div>
      <div className="flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/40 px-2 py-1.5 text-xs font-mono text-foreground">
        {prefix ?? <Hash className="h-3 w-3 shrink-0 text-muted-foreground/70" />}
        <span className={cn("truncate", !displayVal && "italic text-muted-foreground")}>
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
  variant?: "default" | "secondary" | "outline" | "destructive";
  className?: string;
}) {
  return (
    <div className="space-y-1">
      <div className={labelBase}>{label}</div>
      <div>
        <Badge
          variant={variant}
          className={cn("px-2 py-0.5 text-[11px] font-medium", className)}
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

export function formatConditionValue(val?: {
  type?: string;
  selector?: string;
  attribute?: string;
  name?: string;
  value?: string;
}): string {
  if (!val || !val.type) return "Not configured";

  switch (val.type) {
    case "static":
      return val.value !== undefined && val.value !== "" ? `"${val.value}"` : `""`;
    case "variable":
      return val.name ? `var(${val.name})` : "var(?)";
    case "text":
      return val.selector ? `text(${val.selector})` : "text(?)";
    case "input_value":
      return val.selector ? `val(${val.selector})` : "val(?)";
    case "attribute":
      return val.selector && val.attribute ? `attr(${val.selector}[${val.attribute}])` : "attr(?)";
    case "url":
      return "page.url";
    case "title":
      return "page.title";
    default:
      return val.value ?? val.name ?? val.selector ?? "Value";
  }
}
