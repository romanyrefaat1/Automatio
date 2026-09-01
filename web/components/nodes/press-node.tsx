"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Keyboard } from "lucide-react";

import type { AutomationNode } from "@/types/types";
import {
  NodeField,
  NodeHeader,
  contentBase,
  nodeBase,
} from "./node-components";

export function PressNode({
  data,
}: NodeProps<AutomationNode>) {
  return (
    <div className={nodeBase}>
      <NodeHeader
        icon={<Keyboard className="h-4 w-4" />}
        title="Press Key"
        description="Press keyboard key"
      />

      <div className={contentBase}>
        <NodeField
          label="Key"
          value={data.key || "Enter"}
        />

        {data.selector && (
          <NodeField
            label="Selector"
            value={data.selector}
          />
        )}
      </div>

      <Handle type="target" position={Position.Top} id="input" />
      <Handle type="source" position={Position.Bottom} id="output" />
    </div>
  );
}
