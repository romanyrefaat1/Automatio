/* web/components/nodes/end-node.tsx */
"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Square as StopIcon, CheckCircle } from "lucide-react";

import type { AutomationNode } from "@/types/nodes";
import {
  NodeCard,
  NodeHeader,
  contentBase,
} from "./node-components";
import { Badge } from "@/components/ui/badge";

export function EndNode({
  data,
  selected,
}: NodeProps<AutomationNode>) {
  return (
    <NodeCard selected={selected}>
      <NodeHeader
        icon={<StopIcon className="h-4 w-4" />}
        title={data.label || "End"}
        description={data.description || "Finish automation and close browser"}
        typeBadge="END"
        iconClass="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30"
        badgeClass="border-rose-500/30 text-rose-600 dark:text-rose-400 bg-rose-500/10"
      />

      <div className={contentBase}>
        <div className="flex items-center gap-1.5 rounded-md border border-border/60 bg-muted/30 px-2.5 py-2 text-xs text-muted-foreground">
          <CheckCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
          <span>Closes browser session & terminates run.</span>
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        id="input"
      />
    </NodeCard>
  );
}