"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { FileText } from "lucide-react";

import type { AutomationNode } from "@/types/nodes";
import {
  NodeField,
  NodeHeader,
  contentBase,
  nodeBase,
} from "./node-components";

export function ExtractTextNode({
  data,
}: NodeProps<AutomationNode>) {
  const config =
    data.config &&
    typeof data.config === "object" &&
    !Array.isArray(data.config)
      ? data.config as {
          selector?: string;
          save_as?: string;
        }
      : {};

  return (
    <div className={nodeBase}>
      <NodeHeader
        icon={<FileText className="h-4 w-4" />}
        title={data.label || "Extract Text"}
        description="Read text from element"
      />

      <div className={contentBase}>
        <NodeField
          label="Selector"
          value={config.selector || "h1"}
        />

        <NodeField
          label="Save as"
          value={config.save_as || "pageTitle"}
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