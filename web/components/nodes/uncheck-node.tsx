/* web/components/nodes/uncheck-node.tsx */
"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Square, Target } from "lucide-react";

import type { AutomationNode } from "@/types/nodes";
import {
  NodeCard,
  NodeCodeField,
  NodeHeader,
  contentBase,
} from "./node-components";
import { Badge } from "@/components/ui/badge";

export function UncheckNode({
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
        icon={<Square className="h-4 w-4" />}
        title={data.label || "Uncheck"}
        description={data.description || "Uncheck checkbox"}
        typeBadge="UNCHECK"
        iconClass="bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30"
        badgeClass="border-slate-500/30 text-slate-600 dark:text-slate-400 bg-slate-500/10"
      />

      <div className={contentBase}>
        <NodeCodeField
          label="Selector"
          value={selector}
          placeholder="#newsletter"
          prefix={<Target className="h-3 w-3 shrink-0 text-slate-500/70" />}
        />

        <div className="pt-0.5">
          <Badge variant="outline" className="border-slate-500/30 bg-slate-500/5 text-slate-600 dark:text-slate-400 text-[11px]">
            Set Checked: false
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