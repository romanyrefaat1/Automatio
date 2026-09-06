"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Clock,
  ListTree,
  MousePointerClick,
  MoreVertical,
  Pencil,
  Play,
  Webhook,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import type { AutomationWithLastRun } from "../_types";
import { AnimatedButton } from "@/components/ui/animated-button";

interface AutomationCardProps {
  automation: AutomationWithLastRun;
}

const statusStyles: Record<string, string> = {
  active:
    "border-transparent bg-[hsl(var(--success-bg))] text-[hsl(var(--success-fg))]",
  paused:
    "border-transparent bg-[hsl(var(--warning-bg))] text-[hsl(var(--warning-fg))]",
  draft:
    "border-transparent bg-[hsl(var(--muted-bg))] text-[hsl(var(--muted-fg))]",
  archived:
    "border-transparent bg-[hsl(var(--secondary-bg))] text-[hsl(var(--secondary-fg))]",
};

const runStatusStyles: Record<string, string> = {
  success:
    "border-transparent bg-[hsl(var(--success-bg))] text-[hsl(var(--success-fg))]",
  completed:
    "border-transparent bg-[hsl(var(--success-bg))] text-[hsl(var(--success-fg))]",
  failed:
    "border-transparent bg-[hsl(var(--destructive-bg))] text-[hsl(var(--destructive-fg))]",
  error:
    "border-transparent bg-[hsl(var(--destructive-bg))] text-[hsl(var(--destructive-fg))]",
  running:
    "border-transparent bg-[hsl(var(--info-bg))] text-[hsl(var(--info-fg))]",
  queued:
    "border-transparent bg-[hsl(var(--muted-bg))] text-[hsl(var(--muted-fg))]",
};

const triggerIcons: Record<string, typeof Zap> = {
  manual: MousePointerClick,
  schedule: Clock,
  webhook: Webhook,
};

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function AutomationCard({
  automation,
}: AutomationCardProps) {
  const router = useRouter();
  const [isRunning, setIsRunning] = useState(false);

  const TriggerIcon = triggerIcons[automation.trigger_type] ?? Zap;

  const lastRunDate = automation.lastRun
    ? new Date(
        automation.lastRun.finished_at ??
          automation.lastRun.started_at ??
          automation.updated_at,
      )
    : null;

  return (
    <Card
      className="
        group relative flex min-h-[218px] flex-col overflow-hidden
        border-border bg-card
        shadow-xs
        transition-all duration-200
        hover:-translate-y-0.5
        hover:border-primary/30
        hover:shadow-md
      "
    >
      <Link
        href={`/builder/${automation.id}`}
        className="absolute inset-0 z-0"
        aria-label={`Open ${automation.name}`}
      />

      <CardHeader className="relative z-10 flex flex-row items-start justify-between gap-3 pb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[hsl(var(--primary-bg))] text-[hsl(var(--primary-fg))]">
              <Zap className="h-4 w-4" />
            </div>

            <h4 className="truncate">{automation.name}</h4>
          </div>

          <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">
            {automation.description || "No description provided."}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="
                relative z-20 h-8 w-8 shrink-0
                text-muted-foreground
                hover:bg-muted hover:text-foreground
              "
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
              <span className="sr-only">Open automation menu</span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="z-50">
            <DropdownMenuItem asChild>
              <Link href={`/builder/${automation.id}`}>
                <Pencil className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem asChild>
              <Link href={`/builder/${automation.id}/runs`}>
                <ListTree className="mr-2 h-4 w-4" />
                View runs
              </Link>
            </DropdownMenuItem>

          
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>

      <CardContent className="relative z-10 mt-auto pt-0">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="secondary"
            className={statusStyles[automation.status] ?? ""}
          >
            <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-current" />
            {formatLabel(automation.status)}
          </Badge>

          <Badge
            variant="outline"
            className="gap-1.5 border-border bg-background/50 text-muted-foreground"
          >
            <TriggerIcon className="h-3 w-3" />
            {formatLabel(automation.trigger_type)}
          </Badge>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground">
              Last run
            </p>

            {automation.lastRun && lastRunDate ? (
              <div className="mt-1 flex min-w-0 items-center gap-2">
                <Badge
                  variant="secondary"
                  className={`px-1.5 py-0 text-[11px] ${
                    runStatusStyles[automation.lastRun.status] ?? ""
                  }`}
                >
                  {formatLabel(automation.lastRun.status)}
                </Badge>

                <span className="truncate text-xs text-muted-foreground">
                  {formatDistanceToNow(lastRunDate, {
                    addSuffix: true,
                  })}
                </span>
              </div>
            ) : (
              <p className="mt-1 text-xs text-muted-foreground">
                Never run
              </p>
            )}
          </div>

          <Link href={`/builder/${automation.id}`}>
          <AnimatedButton>
              <Play className="mr-2 h-4 w-4" />
              Visit builder
              </AnimatedButton>
            </Link>
        </div>
      </CardContent>
    </Card>
  );
}