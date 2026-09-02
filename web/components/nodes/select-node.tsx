"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ListFilter } from "lucide-react";

import type { AutomationNode } from "@/types/nodes";
import {
  NodeField,
  NodeHeader,
  contentBase,
  nodeBase,
} from "./node-components";

export function SelectNode({
  data,
}: NodeProps<AutomationNode>) {
  const config =
    data.config &&
    typeof data.config === "object" &&
    !Array.isArray(data.config)
      ? data.config as {
          selector?: string;
          value?: string;
        }
      : {};

  return (
    <div className={nodeBase}>
      <NodeHeader
        icon={<ListFilter className="h-4 w-4" />}
        title={data.label || "Select"}
        description="Select an option"
      />

      <div className={contentBase}>
        <NodeField
          label="Selector"
          value={config.selector || "#country"}
        />

        <NodeField
          label="Value"
          value={config.value || "Egypt"}
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