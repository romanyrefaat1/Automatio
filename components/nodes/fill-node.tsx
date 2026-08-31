"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Type } from "lucide-react";

import type { AutomationNode } from "@/types/types";
import {
  NodeField,
  NodeHeader,
  contentBase,
  nodeBase,
} from "./node-components";

export function FillNode({
  data,
}: NodeProps<AutomationNode>) {
  return (
    <div className={nodeBase}>
      <NodeHeader
        icon={<Type className="h-4 w-4" />}
        title="Fill"
        description="Enter text"
      />

      <div className={contentBase}>
        <NodeField
          label="Selector"
          value={data.selector || "#email"}
        />

        <NodeField
          label="Value"
          value={data.value || "user@example.com"}
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
