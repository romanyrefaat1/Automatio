/* web/components/nodes/wait-for-element-node.tsx */
"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ScanSearch, Target, Timer } from "lucide-react";

import type { AutomationNode } from "@/types/nodes";
import {
  NodeCard,
  NodeCodeField,
  NodeHeader,
  contentBase,
} from "./node-components";
import { Badge } from "@/components/ui/badge";

export function WaitForElementNode({
  data,
  selected,
}: NodeProps<AutomationNode>) {
  const config = (data.config && typeof data.config === "object" && !Array.isArray(data.config)
    ? data.config
    : {}) as {
      selector?: string;
      state?: "attached" | "detached" | "visible" | "hidden";
      timeout?: number;
    };

  const selector = config.selector || (data.selector as string | undefined) || "";
  const state = config.state || "visible";
  const timeout = config.timeout ?? 5000;

  const stateColors: Record<string, string> = {
    visible: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    hidden: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    attached: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    detached: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
  };

  return (
    <NodeCard selected={selected}>
      <NodeHeader
        icon={<ScanSearch className="h-4 w-4" />}
        title={data.label || "Wait for Element"}
        description={data.description || "Wait until element matches state"}
        typeBadge="WAIT ELEMENT"
        iconClass="bg-teal-500/15 text-teal-600 dark:text-teal-400 border-teal-500/30"
        badgeClass="border-teal-500/30 text-teal-600 dark:text-teal-400 bg-teal-500/10"
      />

      <div className={contentBase}>
        <NodeCodeField
          label="Target Element"
          value={selector}
          placeholder="#content"
          prefix={<Target className="h-3 w-3 shrink-0 text-teal-500/70" />}
        />

        <div className="flex items-center gap-2 pt-0.5">
          <Badge
            variant="outline"
            className={`text-[11px] capitalize ${stateColors[state] || ""}`}
          >
            State: {state}
          </Badge>

          {timeout > 0 && (
            <Badge variant="secondary" className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Timer className="h-3 w-3" />
              <span>{timeout.toLocaleString()} ms</span>
            </Badge>
          )}
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        id="input"
      />

      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
      />
    </NodeCard>
  );
}