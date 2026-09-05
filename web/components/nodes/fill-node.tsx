/* web/components/nodes/fill-node.tsx */
"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Type, Target, Timer } from "lucide-react";

import type { AutomationNode } from "@/types/nodes";
import {
  NodeCard,
  NodeCodeField,
  NodeField,
  NodeHeader,
  NodeVariablePill,
  contentBase,
} from "./node-components";
import { Badge } from "@/components/ui/badge";

export function FillNode({
  data,
  selected,
}: NodeProps<AutomationNode>) {
  const config = (data.config && typeof data.config === "object" && !Array.isArray(data.config)
    ? data.config
    : {}) as {
      selector?: string;
      value?: string;
      timeout?: number;
    };

  const selector = config.selector || (data.selector as string | undefined) || "";
  const value = config.value !== undefined ? String(config.value) : (data.value ? String(data.value) : "");
  const timeout = config.timeout;

  const isVariable = typeof value === "string" && value.startsWith("{{") && value.endsWith("}}");

  return (
    <NodeCard selected={selected}>
      <NodeHeader
        icon={<Type className="h-4 w-4" />}
        title={data.label || "Fill"}
        description={data.description || "Enter text into field"}
        typeBadge="FILL"
        iconClass="bg-violet-500/15 text-violet-600 dark:text-violet-400 border-violet-500/30"
        badgeClass="border-violet-500/30 text-violet-600 dark:text-violet-400 bg-violet-500/10"
      />

      <div className={contentBase}>
        <NodeCodeField
          label="Selector"
          value={selector}
          placeholder="#input"
          prefix={<Target className="h-3 w-3 shrink-0 text-violet-500/70" />}
        />

        <NodeField label="Input Value">
          {isVariable ? (
            <div className="pt-0.5">
              <NodeVariablePill name={value} />
            </div>
          ) : (
            <div className="truncate rounded-md border border-border/60 bg-muted/40 px-2.5 py-1.5 text-xs text-foreground">
              {value || <span className="italic text-muted-foreground">Empty value</span>}
            </div>
          )}
        </NodeField>

        {timeout && timeout > 0 ? (
          <div className="pt-0.5">
            <Badge variant="secondary" className="flex items-center gap-1 text-[11px] text-muted-foreground w-fit">
              <Timer className="h-3 w-3" />
              <span>{timeout} ms timeout</span>
            </Badge>
          </div>
        ) : null}
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