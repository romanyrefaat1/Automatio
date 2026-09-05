"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Repeat } from "lucide-react";

import type { AutomationNode } from "@/types/nodes";
import {
  NodeField,
  NodeHeader,
  contentBase,
  nodeBase,
} from "./node-components";

export function LoopNode({
  data,
}: NodeProps<AutomationNode>) {
  const config = data.config;

  return (
    <div className={nodeBase}>
      <NodeHeader
        icon={<Repeat className="h-4 w-4" />}
        title={data.label || "Loop"}
        description="Repeat workflow steps"
        iconClass="bg-blue-500/10 text-blue-500"
      />

      <div className={contentBase}>
        <NodeField
          label="Config"
          value={
            config
              ? JSON.stringify(config)
              : "Configure loop"
          }
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
        id="body"
        style={{ left: "35%" }}
      />

      <Handle
        type="source"
        position={Position.Bottom}
        id="done"
        style={{ left: "65%" }}
      />

      <div className="flex justify-between px-5 pb-3 text-[10px] font-medium text-muted-foreground">
        <span>BODY</span>
        <span>DONE</span>
      </div>
    </div>
  );
}