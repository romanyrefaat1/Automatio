"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ScanSearch } from "lucide-react";

import type { AutomationNode } from "@/types/nodes";
import {
  NodeField,
  NodeHeader,
  contentBase,
  nodeBase,
} from "./node-components";

export function WaitForElementNode({
  data,
}: NodeProps<AutomationNode>) {
  const config =
    data.config &&
    typeof data.config === "object" &&
    !Array.isArray(data.config)
      ? data.config as {
          selector?: string;
          state?: "attached" | "detached" | "visible" | "hidden";
          timeout?: number;
        }
      : {};

  return (
    <div className={nodeBase}>
      <NodeHeader
        icon={<ScanSearch className="h-4 w-4" />}
        title={data.label || "Wait for Element"}
        description="Wait until element exists"
      />

      <div className={contentBase}>
        <NodeField
          label="Selector"
          value={config.selector || "#content"}
        />

        <NodeField
          label="State"
          value={config.state || "visible"}
        />

        <NodeField
          label="Timeout"
          value={`${config.timeout ?? 5000} ms`}
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