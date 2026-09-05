/* web/components/nodes/click-node.tsx */
"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { MousePointer2, Target, Timer } from "lucide-react";

import type { AutomationNode } from "@/types/nodes";
import {
  NodeCard,
  NodeCodeField,
  NodeHeader,
  contentBase,
} from "./node-components";
import { Badge } from "@/components/ui/badge";

export function ClickNode({
  data,
  selected,
}: NodeProps<AutomationNode>) {
  const config = (data.config && typeof data.config === "object" && !Array.isArray(data.config)
    ? data.config
    : {}) as {
      selector?: string;
      button?: "left" | "right" | "middle";
      timeout?: number;
    };

  const selector = config.selector || (data.selector as string | undefined) || "";
  const button = config.button || "left";
  const timeout = config.timeout;

  return (
    <NodeCard selected={selected}>
      <NodeHeader
        icon={<MousePointer2 className="h-4 w-4" />}
        title={data.label || "Click"}
        description={data.description || "Click an element"}
        typeBadge="CLICK"
        iconClass="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30"
        badgeClass="border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10"
      />

      <div className={contentBase}>
        <NodeCodeField
          label="Selector"
          value={selector}
          placeholder="#button"
          prefix={<Target className="h-3 w-3 shrink-0 text-indigo-500/70" />}
        />

        <div className="flex items-center gap-2 pt-0.5">
          <Badge variant="outline" className="text-[11px] capitalize text-foreground">
            {button} click
          </Badge>

          {timeout && timeout > 0 ? (
            <Badge variant="secondary" className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <Timer className="h-3 w-3" />
              <span>{timeout} ms</span>
            </Badge>
          ) : null}
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
