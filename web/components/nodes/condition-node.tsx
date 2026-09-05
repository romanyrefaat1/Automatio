/* web/components/nodes/condition-node.tsx */
"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { GitBranch, Check, X } from "lucide-react";

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

export function ConditionNode({
  data,
  selected,
}: NodeProps<AutomationNode>) {
  const config = (data.config && typeof data.config === "object" && !Array.isArray(data.config)
    ? data.config
    : {}) as {
      left?: ValueConfig;
      operator?: "is" | "is_not" | "contains" | "not_contains" | "starts_with" | "ends_with";
      right?: ValueConfig;
      condition?: string; // legacy fallback
    };

  const leftText = config.left ? formatConditionValue(config.left) : "";
  const operator = config.operator ?? "is";
  const rightText = config.right ? formatConditionValue(config.right) : "";

  const operatorLabels: Record<string, string> = {
    is: "==",
    is_not: "!=",
    contains: "contains",
    not_contains: "does not contain",
    starts_with: "starts with",
    ends_with: "ends with",
  };

  const hasConfiguredCondition = Boolean(config.left && config.right);
  const fallbackCondition = (data.condition as string | undefined) || "Branch condition";

  return (
    <NodeCard selected={selected}>
      <NodeHeader
        icon={<GitBranch className="h-4 w-4" />}
        title={data.label || "Condition"}
        description={data.description || "Branch workflow on condition"}
        typeBadge="IF / ELSE"
        iconClass="bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30"
        badgeClass="border-violet-500/30 text-violet-600 dark:text-violet-400 bg-violet-500/10"
      />

      <div className={contentBase}>
        {hasConfiguredCondition ? (
          <div className="space-y-1.5 rounded-lg border border-border/70 bg-muted/40 p-2.5 text-xs">
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-foreground truncate">
              <span className="font-semibold text-primary">{leftText}</span>
            </div>
            <div className="flex items-center">
              <Badge variant="outline" className="h-4 px-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground border-border">
                {operatorLabels[operator] ?? operator}
              </Badge>
            </div>
            <div className="flex items-center gap-1.5 font-mono text-[11px] text-foreground truncate">
              <span className="font-semibold text-violet-600 dark:text-violet-400">{rightText}</span>
            </div>
          </div>
        ) : (
          <div className="rounded-md border border-border/60 bg-muted/40 px-2.5 py-2 text-xs text-muted-foreground italic">
            {fallbackCondition}
          </div>
        )}

        <div className="flex items-center justify-between px-2 pt-1">
          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            <Check className="h-3 w-3" />
            <span>TRUE</span>
          </div>
          <div className="flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400">
            <X className="h-3 w-3" />
            <span>FALSE</span>
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
        id="true"
        style={{ left: "28%" }}
        className="!bg-emerald-500 !border-emerald-700"
      />

      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ left: "72%" }}
        className="!bg-rose-500 !border-rose-700"
      />
    </NodeCard>
  );
}
