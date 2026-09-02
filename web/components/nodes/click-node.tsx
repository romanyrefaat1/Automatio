"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { MousePointer2 } from "lucide-react";

import type { AutomationNode } from "@/types/nodes";
import {
  NodeField,
  NodeHeader,
  contentBase,
  nodeBase,
} from "./node-components";

export function ClickNode({
  data,
}: NodeProps<AutomationNode>) {
  return (
    <div className={nodeBase}>
      <NodeHeader
        icon={<MousePointer2 className="h-4 w-4" />}
        title="Click"
        description="Click an element"
      />

      <div className={contentBase}>
        <NodeField
          label="Selector"
          value={data.selector || "#button"}
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
