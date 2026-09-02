"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Play } from "lucide-react";

import type { AutomationNode } from "@/types/nodes";
import {
  NodeField,
  NodeHeader,
  contentBase,
  nodeBase,
} from "./node-components";

export function TriggerNode({
  data,
}: NodeProps<AutomationNode>) {
  const config = data.config;

  return (
    <div className={nodeBase}>
      <NodeHeader
        icon={<Play className="h-4 w-4" />}
        title={data.label || "Trigger"}
        description="Start the automation"
        iconClass="bg-green-500/10 text-green-500"
      />

      <div className={contentBase}>
        <NodeField
          label="Config"
          value={
            config
              ? JSON.stringify(config)
              : "Automation trigger"
          }
        />
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
      />
    </div>
  );
}