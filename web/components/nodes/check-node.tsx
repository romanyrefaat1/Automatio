/* web/components/nodes/check-node.tsx */
"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { CheckSquare, Target } from "lucide-react";

import type { AutomationNode } from "@/types/nodes";
import {
  NodeCard,
  NodeCodeField,
  NodeHeader,
  contentBase,
} from "./node-components";
import { Badge } from "@/components/ui/badge";

export function CheckNode({
  data,
  selected,
}: NodeProps<AutomationNode>) {
  const config = (data.config && typeof data.config === "object" && !Array.isArray(data.config)
    ? data.config
    : {}) as {
      selector?: string;
    };

  const selector = config.selector || (data.selector as string | undefined) || "";

  return (
    <NodeCard selected={selected}>
      <NodeHeader
        icon={<CheckSquare className="h-4 w-4" />}
        title={data.label || "Check"}
        description={data.description || "Check checkbox or radio"}
        typeBadge="CHECK"
        iconClass="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
        badgeClass="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
      />

      <div className={contentBase}>
        <NodeCodeField
          label="Selector"
          value={selector}
          placeholder="#terms"
          prefix={<Target className="h-3 w-3 shrink-0 text-emerald-500/70" />}
        />

        <div className="pt-0.5">
          <Badge variant="outline" className="border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 text-[11px]">
            Set Checked: true
          </Badge>
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
