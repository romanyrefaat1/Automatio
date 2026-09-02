"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { BadgeCheck } from "lucide-react";

import type { AutomationNode } from "@/types/nodes";
import {
  NodeField,
  NodeHeader,
  contentBase,
  nodeBase,
} from "./node-components";

export function AssertValueNode({
  data,
}: NodeProps<AutomationNode>) {
  const config = data.config;

  return (
    <div className={nodeBase}>
      <NodeHeader
        icon={<BadgeCheck className="h-4 w-4" />}
        title={data.label || "Assert Value"}
        description="Verify a value"
        iconClass="bg-amber-500/10 text-amber-500"
      />

      <div className={contentBase}>
        <NodeField
          label="Config"
          value={
            config
              ? JSON.stringify(config)
              : "Configure assertion"
          }
        />
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
    </div>
  );
}