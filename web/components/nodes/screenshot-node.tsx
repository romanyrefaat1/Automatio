"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Camera } from "lucide-react";

import type { AutomationNode } from "@/types/types";
import {
  NodeField,
  NodeHeader,
  contentBase,
  nodeBase,
} from "./node-components";

export function ScreenshotNode({
  data,
}: NodeProps<AutomationNode>) {
  return (
    <div className={nodeBase}>
      <NodeHeader
        icon={<Camera className="h-4 w-4" />}
        title="Screenshot"
        description="Capture page"
      />

      <div className={contentBase}>
        <NodeField
          label="File name"
          value={data.value || "screenshot.png"}
        />
      </div>

      <Handle type="target" position={Position.Top} id="input" />
      <Handle type="source" position={Position.Bottom} id="output" />
    </div>
  );
}
