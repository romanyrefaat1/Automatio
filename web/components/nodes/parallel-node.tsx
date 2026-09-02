"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { GitFork } from "lucide-react";

import type { AutomationNode } from "@/types/nodes";
import {
  NodeField,
  NodeHeader,
  contentBase,
  nodeBase,
} from "./node-components";

export function ParallelNode({
  data,
}: NodeProps<AutomationNode>) {
  const config = data.config;

  return (
    <div className={nodeBase}>
      <NodeHeader
        icon={<GitFork className="h-4 w-4" />}
        title={data.label || "Parallel"}
        description="Run branches in parallel"
        iconClass="bg-indigo-500/10 text-indigo-500"
      />

      <div className={contentBase}>
        <NodeField
          label="Config"
          value={
            config
              ? JSON.stringify(config)
              : "Configure parallel branches"
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