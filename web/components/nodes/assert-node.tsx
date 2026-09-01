"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ShieldCheck } from "lucide-react";

import type { AutomationNode } from "@/types/types";
import {
  NodeField,
  NodeHeader,
  contentBase,
  nodeBase,
} from "./node-components";

export function AssertNode({
  data,
}: NodeProps<AutomationNode>) {
  return (
    <div className={nodeBase}>
      <NodeHeader
        icon={<ShieldCheck className="h-4 w-4" />}
        title="Assert"
        description="Verify expected result"
        iconClass="bg-amber-500/10 text-amber-500"
      />

      <div className={contentBase}>
        <NodeField
          label="Selector"
          value={data.selector}
        />

        <NodeField
          label="Expected"
          value={data.expected || "Expected text"}
        />
      </div>

      <Handle type="target" position={Position.Top} id="input" />
      <Handle type="source" position={Position.Bottom} id="output" />
    </div>
  );
}
