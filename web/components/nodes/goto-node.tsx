"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Globe } from "lucide-react";

import type { AutomationNode } from "@/types/nodes";
import {
  NodeField,
  NodeHeader,
  contentBase,
  nodeBase,
} from "./node-components";

export function GotoNode({
  data,
}: NodeProps<AutomationNode>) {
  const config =
    data.config &&
    typeof data.config === "object" &&
    !Array.isArray(data.config)
      ? data.config as {
          url?: string;
        }
      : {};

  return (
    <div className={nodeBase}>
      <NodeHeader
        icon={<Globe className="h-4 w-4" />}
        title={data.label || "Go to URL"}
        description="Navigate browser"
      />

      <div className={contentBase}>
        <NodeField
          label="URL"
          value={config.url || "https://example.com"}
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