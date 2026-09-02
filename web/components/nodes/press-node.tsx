"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Keyboard } from "lucide-react";

import type { AutomationNode } from "@/types/nodes";
import {
  NodeField,
  NodeHeader,
  contentBase,
  nodeBase,
} from "./node-components";

export function PressNode({
  data,
}: NodeProps<AutomationNode>) {
  const config =
    data.config &&
    typeof data.config === "object" &&
    !Array.isArray(data.config)
      ? data.config as {
          selector?: string;
          key?: string;
        }
      : {};

  return (
    <div className={nodeBase}>
      <NodeHeader
        icon={<Keyboard className="h-4 w-4" />}
        title={data.label || "Press Key"}
        description="Press keyboard key"
      />

      <div className={contentBase}>
        <NodeField
          label="Key"
          value={config.key || "Enter"}
        />

        <NodeField
          label="Selector"
          value={config.selector || "body"}
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