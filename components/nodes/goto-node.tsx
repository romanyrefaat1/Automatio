"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Globe } from "lucide-react";

import type { AutomationNode } from "@/types/types";
import {
  NodeField,
  NodeHeader,
  contentBase,
  nodeBase,
} from "./node-components";

export function GotoNode({
  data,
}: NodeProps<AutomationNode>) {
  return (
    <div className={nodeBase}>
      <NodeHeader
        icon={<Globe className="h-4 w-4" />}
        title="Go to URL"
        description="Navigate browser"
      />

      <div className={contentBase}>
        <NodeField
          label="URL"
          value={data.url || "https://example.com"}
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
