"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ScanSearch } from "lucide-react";

import type { AutomationNode } from "@/types/types";
import {
  NodeField,
  NodeHeader,
  contentBase,
  nodeBase,
} from "./node-components";

export function WaitForElementNode({
  data,
}: NodeProps<AutomationNode>) {
  return (
    <div className={nodeBase}>
      <NodeHeader
        icon={<ScanSearch className="h-4 w-4" />}
        title="Wait for Element"
        description="Wait until element exists"
      />

      <div className={contentBase}>
        <NodeField
          label="Selector"
          value={data.selector || "#content"}
        />

        <NodeField
          label="Timeout"
          value={`${data.duration ?? 5000} ms`}
        />
      </div>

      <Handle type="target" position={Position.Top} id="input" />
      <Handle type="source" position={Position.Bottom} id="output" />
    </div>
  );
}
