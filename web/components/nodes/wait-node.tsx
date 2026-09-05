/* web/components/nodes/wait-node.tsx */
"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Clock, Hourglass } from "lucide-react";

import type { AutomationNode } from "@/types/nodes";
import {
  NodeCard,
  NodeHeader,
  contentBase,
} from "./node-components";
import { Badge } from "@/components/ui/badge";

export function WaitNode({
  data,
  selected,
}: NodeProps<AutomationNode>) {
  const config = (data.config && typeof data.config === "object" && !Array.isArray(data.config)
    ? data.config
    : {}) as {
      milliseconds?: number;
      duration?: number;
    };

  const ms = config.milliseconds ?? config.duration ?? (data.duration as number | undefined) ?? 1000;
  const seconds = (ms / 1000).toFixed(ms % 1000 === 0 ? 0 : 1);

  return (
    <NodeCard selected={selected}>
      <NodeHeader
        icon={<Clock className="h-4 w-4" />}
        title={data.label || "Wait"}
        description={data.description || "Pause execution"}
        typeBadge="WAIT"
        iconClass="bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30"
        badgeClass="border-yellow-500/30 text-yellow-600 dark:text-yellow-400 bg-yellow-500/10"
      />

      <div className={contentBase}>
        <div className="space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Pause Duration
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="flex items-center gap-1.5 text-xs font-mono font-medium py-1">
              <Hourglass className="h-3 w-3 text-yellow-500" />
              <span>{ms.toLocaleString()} ms</span>
              <span className="text-[10px] text-muted-foreground">({seconds}s)</span>
            </Badge>
          </div>
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