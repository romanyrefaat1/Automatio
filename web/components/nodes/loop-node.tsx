/* web/components/nodes/loop-node.tsx */
"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Repeat, ArrowRight, CheckCircle2 } from "lucide-react";

import type { AutomationNode } from "@/types/nodes";
import {
  NodeCard,
  NodeHeader,
  contentBase,
  formatConditionValue,
} from "./node-components";
import { Badge } from "@/components/ui/badge";

type ValueConfig = {
  type?: "static" | "variable" | "text" | "input_value" | "attribute" | "url" | "title";
  selector?: string;
  attribute?: string;
  name?: string;
  value?: string;
};

type LoopCondition = {
  left?: ValueConfig;
  operator?: string;
  right?: ValueConfig;
};

export function LoopNode({
  data,
  selected,
}: NodeProps<AutomationNode>) {
  const config = (data.config && typeof data.config === "object" && !Array.isArray(data.config)
    ? data.config
    : {}) as {
      max_iterations?: number;
      condition?: LoopCondition;
    };

  const maxIterations = config.max_iterations;
  const loopCond = config.condition;

  const leftText = loopCond?.left ? formatConditionValue(loopCond.left) : "";
  const operator = loopCond?.operator ?? "is";
  const rightText = loopCond?.right ? formatConditionValue(loopCond.right) : "";

  const operatorLabels: Record<string, string> = {
    is: "==",
    is_not: "!=",
    contains: "contains",
    not_contains: "!contains",
    starts_with: "starts with",
    ends_with: "ends with",
  };

  const hasCondition = Boolean(loopCond?.left && loopCond?.right);

  return (
    <NodeCard selected={selected}>
      <NodeHeader
        icon={<Repeat className="h-4 w-4" />}
        title={data.label || "Loop"}
        description={data.description || "Repeat workflow steps"}
        typeBadge="LOOP"
        iconClass="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30"
        badgeClass="border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10"
      />

      <div className={contentBase}>
        <div className="flex items-center justify-between gap-1">
          <Badge variant="secondary" className="text-[11px] font-medium">
            {maxIterations && maxIterations > 0 ? `Max: ${maxIterations} loops` : "Until condition fails"}
          </Badge>
        </div>

        {hasCondition ? (
          <div className="space-y-1 rounded-md border border-border/70 bg-muted/40 p-2 text-xs">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              While:
            </div>
            <div className="flex items-center gap-1 font-mono text-[11px] text-foreground truncate">
              <span className="font-semibold text-primary">{leftText}</span>
              <span className="text-muted-foreground font-sans text-[10px]">{operatorLabels[operator] ?? operator}</span>
              <span className="font-semibold text-blue-600 dark:text-blue-400">{rightText}</span>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-border/60 bg-muted/30 px-2.5 py-1.5 text-xs text-muted-foreground italic">
            Loop over iterations
          </div>
        )}

        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-1 text-[10px] font-bold text-primary">
            <ArrowRight className="h-3 w-3" />
            <span>BODY</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground">
            <CheckCircle2 className="h-3 w-3" />
            <span>DONE</span>
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
        id="body"
        style={{ left: "28%" }}
        className="!bg-primary !border-primary"
      />

      <Handle
        type="source"
        position={Position.Bottom}
        id="done"
        style={{ left: "72%" }}
        className="!bg-muted-foreground !border-muted-foreground"
      />
    </NodeCard>
  );
}