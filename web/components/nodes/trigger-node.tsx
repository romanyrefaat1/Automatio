"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Play } from "lucide-react";

import type { AutomationNode } from "@/types/types";
import {
  NodeHeader,
  contentBase,
  nodeBase,
} from "./node-components";

export function TriggerNode({
  data,
}: NodeProps<AutomationNode>) {
  return (
    <div className={nodeBase}>
      <NodeHeader
        icon={<Play className="h-4 w-4" />}
        title={data.label || "Trigger"}
        description="Start automation"
        iconClass="bg-emerald-500/10 text-emerald-500"
      />

      <div className={contentBase}>
        <div className="text-xs text-muted-foreground">
          Automation starts here.
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
      />
    </div>
  );
}
