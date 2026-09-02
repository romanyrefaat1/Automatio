"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Camera } from "lucide-react";

import type { AutomationNode } from "@/types/nodes";
import {
  NodeField,
  NodeHeader,
  contentBase,
  nodeBase,
} from "./node-components";

export function ScreenshotNode({
  data,
}: NodeProps<AutomationNode>) {
  const config =
    data.config &&
    typeof data.config === "object" &&
    !Array.isArray(data.config)
      ? data.config as {
          fullPage?: boolean;
        }
      : {};

  return (
    <div className={nodeBase}>
      <NodeHeader
        icon={<Camera className="h-4 w-4" />}
        title={data.label || "Screenshot"}
        description="Capture page"
      />

      <div className={contentBase}>
        <NodeField
          label="Full page"
          value={config.fullPage ? "Yes" : "No"}
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