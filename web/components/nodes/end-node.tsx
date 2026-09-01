"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Square as StopIcon } from "lucide-react";

import type { AutomationNode } from "@/types/types";
import {
  NodeHeader,
  contentBase,
  nodeBase,
} from "./node-components";

export function EndNode({
  data,
}: NodeProps<AutomationNode>) {
  return (
    <div className={nodeBase}>
      <NodeHeader
        icon={<StopIcon className="h-4 w-4" />}
        title={data.label || "End"}
        description="Finish automation"
        iconClass="bg-red-500/10 text-red-500"
      />

      <div className={contentBase}>
        <div className="text-xs text-muted-foreground">
          Automation completed.
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        id="input"
      />
    </div>
  );
}
