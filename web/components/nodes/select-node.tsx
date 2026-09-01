"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ListFilter } from "lucide-react";

import type { AutomationNode } from "@/types/types";
import {
  NodeField,
  NodeHeader,
  contentBase,
  nodeBase,
} from "./node-components";

export function SelectNode({
  data,
}: NodeProps<AutomationNode>) {
  return (
    <div className={nodeBase}>
      <NodeHeader
        icon={<ListFilter className="h-4 w-4" />}
        title="Select"
        description="Select an option"
      />

      <div className={contentBase}>
        <NodeField
          label="Selector"
          value={data.selector || "#country"}
        />

        <NodeField
          label="Option"
          value={data.option || "Egypt"}
        />
      </div>

      <Handle type="target" position={Position.Top} id="input" />
      <Handle type="source" position={Position.Bottom} id="output" />
    </div>
  );
}
