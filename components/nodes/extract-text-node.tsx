"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { FileText } from "lucide-react";

import type { AutomationNode } from "@/types/types";
import {
  NodeField,
  NodeHeader,
  contentBase,
  nodeBase,
} from "./node-components";

export function ExtractTextNode({
  data,
}: NodeProps<AutomationNode>) {
  return (
    <div className={nodeBase}>
      <NodeHeader
        icon={<FileText className="h-4 w-4" />}
        title="Extract Text"
        description="Read text from element"
      />

      <div className={contentBase}>
        <NodeField
          label="Selector"
          value={data.selector || "h1"}
        />

        <NodeField
          label="Save as"
          value={data.variable || "pageTitle"}
        />
      </div>

      <Handle type="target" position={Position.Top} id="input" />
      <Handle type="source" position={Position.Bottom} id="output" />
    </div>
  );
}
