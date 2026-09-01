"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Clock } from "lucide-react";

import type { AutomationNode } from "@/types/types";
import {
  NodeField,
  NodeHeader,
  contentBase,
  nodeBase,
} from "./node-components";

export function WaitNode({
  data,
}: NodeProps<AutomationNode>) {
  return (
    <div className={nodeBase}>
      <NodeHeader
        icon={<Clock className="h-4 w-4" />}
        title="Wait"
        description="Pause execution"
      />

      <div className={contentBase}>
        <NodeField
          label="Duration"
          value={`${data.duration ?? 1000} ms`}
        />
      </div>

      <Handle type="target" position={Position.Top} id="input" />
      <Handle type="source" position={Position.Bottom} id="output" />
    </div>
  );
}
