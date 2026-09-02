"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Bot } from "lucide-react";

import type { AutomationNode } from "@/types/nodes";
import {
  NodeField,
  NodeHeader,
  contentBase,
  nodeBase,
} from "./node-components";

export function CallChatGPTNode({
  data,
}: NodeProps<AutomationNode>) {
  const config = data.config;

  return (
    <div className={nodeBase}>
      <NodeHeader
        icon={<Bot className="h-4 w-4" />}
        title={data.label || "Call ChatGPT"}
        description="Run an AI request"
        iconClass="bg-emerald-500/10 text-emerald-500"
      />

      <div className={contentBase}>
        <NodeField
          label="Config"
          value={
            config
              ? JSON.stringify(config)
              : "Configure ChatGPT request"
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