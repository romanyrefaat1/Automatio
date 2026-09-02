"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { GitBranch } from "lucide-react";

import type { AutomationNode } from "@/types/nodes";
import {
  NodeField,
  NodeHeader,
  contentBase,
  nodeBase,
} from "./node-components";

export function ConditionNode({
  data,
}: NodeProps<AutomationNode>) {
  return (
    <div className={nodeBase}>
      <NodeHeader
        icon={<GitBranch className="h-4 w-4" />}
        title="Condition"
        description="Branch workflow"
        iconClass="bg-violet-500/10 text-violet-500"
      />

      <div className={contentBase}>
        <NodeField
          label="Condition"
          value={data.condition || "Element exists"}
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
        id="true"
        style={{ left: "35%" }}
      />

      <Handle
        type="source"
        position={Position.Bottom}
        id="false"
        style={{ left: "65%" }}
      />

      <div className="flex justify-between px-5 pb-3 text-[10px] font-medium text-muted-foreground">
        <span>TRUE</span>
        <span>FALSE</span>
      </div>
    </div>
  );
}
