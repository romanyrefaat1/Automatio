/* web/components/nodes/extract-text-node.tsx */
"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { FileText, Target } from "lucide-react";

import type { AutomationNode } from "@/types/nodes";
import {
  NodeCard,
  NodeCodeField,
  NodeField,
  NodeHeader,
  NodeVariablePill,
  contentBase,
} from "./node-components";

export function ExtractTextNode({
  data,
  selected,
}: NodeProps<AutomationNode>) {
  const config = (data.config && typeof data.config === "object" && !Array.isArray(data.config)
    ? data.config
    : {}) as {
      selector?: string;
      save_as?: string;
      variable?: string;
    };

  const selector = config.selector || (data.selector as string | undefined) || "";
  const saveAs = config.save_as || config.variable || (data.save_as as string | undefined) || (data.variable as string | undefined) || "";

  return (
    <NodeCard selected={selected}>
      <NodeHeader
        icon={<FileText className="h-4 w-4" />}
        title={data.label || "Extract Text"}
        description={data.description || "Read text from element"}
        typeBadge="EXTRACT"
        iconClass="bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30"
        badgeClass="border-cyan-500/30 text-cyan-600 dark:text-cyan-400 bg-cyan-500/10"
      />

      <div className={contentBase}>
        <NodeCodeField
          label="Source Element"
          value={selector}
          placeholder="h1"
          prefix={<Target className="h-3 w-3 shrink-0 text-cyan-500/70" />}
        />

        <NodeField label="Save to Variable">
          <div className="pt-0.5">
            {saveAs ? (
              <NodeVariablePill name={saveAs} />
            ) : (
              <span className="italic text-xs text-muted-foreground">None specified</span>
            )}
          </div>
        </NodeField>
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
    </NodeCard>
  );
}