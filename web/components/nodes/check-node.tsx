"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Check } from "lucide-react";

import type { AutomationNode } from "@/types/types";
import {
  NodeField,
  NodeHeader,
  contentBase,
  nodeBase,
} from "./node-components";

export function CheckNode({
  data,
}: NodeProps<AutomationNode>) {
  return (
    <div className={nodeBase}>
      <NodeHeader
        icon={<Check className="h-4 w-4" />}
        title="Check"
        description="Check checkbox"
      />

      <div className={contentBase}>
        <NodeField
          label="Selector"
          value={data.selector || "#terms"}
        />
      </div>

      <Handle type="target" position={Position.Top} id="input" />
      <Handle type="source" position={Position.Bottom} id="output" />
    </div>
  );
}
