"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  Clock,
  Copy,
  ListChecks,
  Pencil,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import type { Tables } from "@/types/supabase-auto";
import { createClient } from "@/lib/supabase/client";

import { useAutomationContext } from "../contexts/AutomationContext";
import { useAutomationNodes } from "../contexts/AutomationNodesContext";

type AutomationRun = Tables<"automation_runs">;
type AutomationStatus = Tables<"automations">["status"];

const STATUS_META: Record<
  AutomationStatus,
  { label: string; dotClassName: string }
> = {
  active: {
    label: "Active",
    dotClassName: "bg-[hsl(var(--success))]",
  },
  paused: {
    label: "Paused",
    dotClassName: "bg-[hsl(var(--warning))]",
  },
  archived: {
    label: "Archived",
    dotClassName: "bg-muted-foreground",
  },
};

function timeAgo(iso: string | null) {
  if (!iso) return null;

  const diffMs =
    Date.now() - new Date(iso).getTime();

  const minutes = Math.round(diffMs / 60000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);

  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);

  return `${days}d ago`;
}

function timeUntil(iso: string | null) {
  if (!iso) return null;

  const diffMs =
    new Date(iso).getTime() - Date.now();

  if (diffMs <= 0) return "any moment";

  const minutes = Math.round(diffMs / 60000);

  if (minutes < 60) return `in ${minutes}m`;

  const hours = Math.round(minutes / 60);

  return `in ${hours}h`;
}

const RUN_STATUS_META: Record<
  AutomationRun["status"],
  { label: string; className: string }
> = {
  queued: {
    label: "Queued",
    className: "text-muted-foreground",
  },
  running: {
    label: "Running",
    className: "text-[hsl(var(--info-fg))]",
  },
  completed: {
    label: "Completed",
    className: "text-[hsl(var(--success-fg))]",
  },
  failed: {
    label: "Failed",
    className: "text-[hsl(var(--destructive-fg))]",
  },
  cancelled: {
    label: "Cancelled",
    className: "text-muted-foreground",
  },
};

export default function AutomationTopInfo() {
  const { automation, schedules, refetch } =
    useAutomationContext();

  const { nodes, edges } =
    useAutomationNodes();

  const router = useRouter();
  const supabase = createClient();

  const [open, setOpen] = useState(false);
  const [isEditingName, setIsEditingName] =
    useState(false);

  const [draftName, setDraftName] =
    useState(automation?.name ?? "");

  const [lastRun, setLastRun] =
    useState<AutomationRun | null>(null);

  /*
   * Keep draft name in sync when
   * automation is loaded/refetched.
   */
  useEffect(() => {
    if (automation) {
      setDraftName(automation.name);
    }
  }, [automation?.name]);

  /*
   * Fetch latest run.
   */
  useEffect(() => {
    if (!automation) return;

    let cancelled = false;

    supabase
      .from("automation_runs")
      .select("*")
      .eq("automation_id", automation.id)
      .order("created_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) {
          setLastRun(data);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [automation?.id]);

  if (!automation) {
    return null;
  }

  const statusMeta =
    STATUS_META[automation.status];

  const activeSchedule =
    schedules.find((s) => s.enabled) ??
    schedules[0];

  /*
   * ----------------------------------------
   * Rename
   * ----------------------------------------
   */

  async function commitName() {
    const trimmed = draftName.trim();

    setIsEditingName(false);

    if (
      !trimmed ||
      trimmed === automation.name
    ) {
      setDraftName(automation.name);
      return;
    }

    const { error } = await supabase
      .from("automations")
      .update({
        name: trimmed,
      })
      .eq("id", automation.id);

    if (error) {
      setDraftName(automation.name);

      console.error(
        "Failed to rename automation:",
        error
      );

      return;
    }

    await refetch();
  }

  /*
   * ----------------------------------------
   * Status
   * ----------------------------------------
   */

  async function updateStatus(
    status: AutomationStatus
  ) {
    const { error } = await supabase
      .from("automations")
      .update({ status })
      .eq("id", automation.id);

    if (error) {
      console.error(
        "Failed to update status:",
        error
      );

      return;
    }

    await refetch();
  }

  /*
   * ----------------------------------------
   * Duplicate
   * ----------------------------------------
   */

  async function handleDuplicate() {
    /*
     * Create the new automation.
     */
    const {
      data: newAutomation,
      error,
    } = await supabase
      .from("automations")
      .insert({
        name: `${automation.name} (copy)`,
        description: automation.description,
        status: "paused",
        user_id: automation.user_id,
      })
      .select()
      .single();

    if (error || !newAutomation) {
      console.error(
        "Failed to duplicate automation:",
        error
      );

      return;
    }

    /*
     * Map old node IDs to new step IDs.
     *
     * This is important because edges reference
     * step IDs.
     */
    const nodeIdMap = new Map<
      string,
      string
    >();

    /*
     * Duplicate nodes as automation steps.
     */
    if (nodes.length > 0) {
      const stepsToInsert = nodes.map(
        (node, index) => {
          const newId = crypto.randomUUID();

          nodeIdMap.set(node.id, newId);

          return {
            id: newId,
            automation_id:
              newAutomation.id,
            title: node.data.title,
            type: node.type,
            config:
              node.data.config ?? {},
            position: index,
          };
        }
      );

      const {
        error: stepsError,
      } = await supabase
        .from("automation_steps")
        .insert(stepsToInsert);

      if (stepsError) {
        console.error(
          "Failed to duplicate steps:",
          stepsError
        );

        return;
      }
    }

    /*
     * Duplicate edges.
     *
     * Translate the old source/target node IDs
     * into the new step IDs.
     */
    if (edges.length > 0) {
      const edgesToInsert = edges
        .map((edge) => {
          const sourceStepId =
            nodeIdMap.get(edge.source);

          const targetStepId =
            nodeIdMap.get(edge.target);

          if (
            !sourceStepId ||
            !targetStepId
          ) {
            return null;
          }

          return {
            id: crypto.randomUUID(),
            automation_id:
              newAutomation.id,
            source_step_id:
              sourceStepId,
            target_step_id:
              targetStepId,
          };
        })
        .filter(
          (
            edge
          ): edge is {
            id: string;
            automation_id: string;
            source_step_id: string;
            target_step_id: string;
          } => edge !== null
        );

      if (edgesToInsert.length > 0) {
        const {
          error: edgesError,
        } = await supabase
          .from("automation_edges")
          .insert(edgesToInsert);

        if (edgesError) {
          console.error(
            "Failed to duplicate edges:",
            edgesError
          );

          return;
        }
      }
    }

    router.push(
      `/builder/${newAutomation.id}`
    );
  }

  /*
   * ----------------------------------------
   * Delete
   * ----------------------------------------
   */

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${automation.name}"? This can't be undone.`
    );

    if (!confirmed) return;

    const { error } = await supabase
      .from("automations")
      .delete()
      .eq("id", automation.id);

    if (error) {
      console.error(
        "Failed to delete automation:",
        error
      );

      return;
    }

    router.push("/automations");
  }

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="h-9 gap-2 rounded-lg border-border bg-card px-3 shadow-sm"
        >
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              statusMeta.dotClassName
            )}
          />

          <span className="max-w-[220px] truncate font-medium">
            {automation.name}
          </span>

          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-80 p-0"
      >
        <div className="space-y-3 p-4">
          {/* Name */}
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <Input
                autoFocus
                value={draftName}
                onChange={(e) =>
                  setDraftName(
                    e.target.value
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    void commitName();
                  }

                  if (e.key === "Escape") {
                    setDraftName(
                      automation.name
                    );

                    setIsEditingName(false);
                  }
                }}
                className="h-8"
              />

              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 shrink-0"
                onClick={() =>
                  void commitName()
                }
              >
                <Check className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <button
              onClick={() =>
                setIsEditingName(true)
              }
              className="group flex w-full items-center justify-between gap-2 text-left"
            >
              <h3 className="truncate">
                {automation.name}
              </h3>

              <Pencil className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </button>
          )}

          {automation.description && (
            <p className="text-muted-foreground">
              {automation.description}
            </p>
          )}

          {/* Status */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="secondary"
                size="sm"
                className="h-7 gap-1.5 px-2"
              >
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    statusMeta.dotClassName
                  )}
                />

                {statusMeta.label}

                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="start">
              {(
                Object.keys(
                  STATUS_META
                ) as AutomationStatus[]
              ).map((status) => (
                <DropdownMenuItem
                  key={status}
                  onClick={() =>
                    void updateStatus(
                      status
                    )
                  }
                  className="gap-2"
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      STATUS_META[status]
                        .dotClassName
                    )}
                  />

                  {
                    STATUS_META[status]
                      .label
                  }
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator />

          {/* Meta */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                Last run
              </span>

              {lastRun ? (
                <span
                  className={
                    RUN_STATUS_META[
                      lastRun.status
                    ].className
                  }
                >
                  {
                    RUN_STATUS_META[
                      lastRun.status
                    ].label
                  }

                  {lastRun.finished_at &&
                    ` · ${timeAgo(
                      lastRun.finished_at
                    )}`}
                </span>
              ) : (
                <span className="text-muted-foreground">
                  Never run
                </span>
              )}
            </div>

            {activeSchedule?.enabled && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  Next run
                </span>

                <span>
                  {timeUntil(
                    activeSchedule.next_run_at ??
                      activeSchedule.run_at
                  ) ?? "—"}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <ListChecks className="h-3.5 w-3.5" />
                Steps
              </span>

              <span>{nodes.length}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                Edited
              </span>

              <span>
                {timeAgo(
                  automation.updated_at
                )}
              </span>
            </div>
          </div>
        </div>

        <Separator />

        <div className="flex items-center gap-1 p-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 flex-1 gap-1.5 text-muted-foreground"
            onClick={() =>
              void handleDuplicate()
            }
          >
            <Copy className="h-3.5 w-3.5" />
            Duplicate
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 flex-1 gap-1.5 text-[hsl(var(--destructive-fg))] hover:text-[hsl(var(--destructive-fg))]"
            onClick={() =>
              void handleDelete()
            }
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}