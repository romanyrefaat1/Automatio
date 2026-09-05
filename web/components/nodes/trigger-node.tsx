/* web/components/nodes/trigger-node.tsx */
"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Play, CalendarClock, PlayCircle } from "lucide-react";

import type { AutomationNode } from "@/types/nodes";
import {
  NodeCard,
  NodeHeader,
  contentBase,
} from "./node-components";
import { Badge } from "@/components/ui/badge";
import { useAutomationContext } from "@/app/(app-screens)/builder/contexts/AutomationContext";
import { AnimatedButton } from "../ui/animated-button";

export function TriggerNode({
  data,
  selected,
}: NodeProps<AutomationNode>) {
  const config = (data.config && typeof data.config === "object" && !Array.isArray(data.config)
    ? data.config
    : {}) as {
      triggerType?: "manual" | "schedule";
      schedule?: {
        interval_seconds?: number;
        run_at?: string;
      };
    };

  const { automation } = useAutomationContext();
  const triggerType = config.triggerType ?? "manual";

  const handleRun = async () => {
    if (!automation?.id) {
      console.error("No automation selected");
      return;
    }

    try {
      const response = await fetch(`/api/automations/${automation.id}/run`, {
        method: "POST",
      });

      const resData = await response.json();

      if (!response.ok) {
        throw new Error(resData.error || "Failed to run automation");
      }

      console.log("Automation started:", resData);
    } catch (error) {
      console.error("Run failed:", error);
    }
  };

  return (
    <NodeCard selected={selected}>
      <NodeHeader
        icon={<Play className="h-4 w-4" />}
        title={data.label || "Trigger"}
        description={data.description || "Start the automation"}
        typeBadge="TRIGGER"
        iconClass="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
        badgeClass="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
      />

      <div className={contentBase}>
        <div className="space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Trigger Type
          </div>
          <div className="flex items-center gap-1.5">
            {triggerType === "schedule" ? (
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                <CalendarClock className="h-3 w-3 text-primary" />
                <span>Scheduled Run</span>
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                <PlayCircle className="h-3 w-3 text-emerald-500" />
                <span>Manual Execution</span>
              </Badge>
            )}
          </div>
        </div>

        {config.schedule && (
          <div className="rounded-md border border-border/60 bg-muted/30 px-2 py-1.5 text-[11px] text-muted-foreground">
            {config.schedule.interval_seconds
              ? `Every ${config.schedule.interval_seconds}s`
              : config.schedule.run_at
              ? `Runs at ${new Date(config.schedule.run_at).toLocaleString()}`
              : "Schedule active"}
          </div>
        )}

        <div className="pt-1">
          <AnimatedButton onClick={handleRun} className="w-full">
            Run Flow
          </AnimatedButton>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
      />
    </NodeCard>
  );
}