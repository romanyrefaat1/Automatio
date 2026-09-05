/* web/components/nodes/select-node.tsx */
"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ListFilter, Target } from "lucide-react";

import type { AutomationNode } from "@/types/nodes";
import {
  NodeCard,
  NodeCodeField,
  NodeField,
  NodeHeader,
  contentBase,
} from "./node-components";
import { Badge } from "@/components/ui/badge";

export function SelectNode({
  data,
  selected,
}: NodeProps<AutomationNode>) {
  const config = (data.config && typeof data.config === "object" && !Array.isArray(data.config)
    ? data.config
    : {}) as {
      selector?: string;
      value?: string;
      option?: string;
    };

  const selector = config.selector || (data.selector as string | undefined) || "";
  const value = config.value ?? config.option ?? (data.value as string | undefined) ?? (data.option as string | undefined) ?? "";

  return (
    <NodeCard selected={selected}>
      <NodeHeader
        icon={<ListFilter className="h-4 w-4" />}
        title={data.label || "Select"}
        description={data.description || "Choose option from dropdown"}
        typeBadge="SELECT"
        iconClass="bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30"
        badgeClass="border-purple-500/30 text-purple-600 dark:text-purple-400 bg-purple-500/10"
      />

      <div className={contentBase}>
        <NodeCodeField
          label="Selector"
          value={selector}
          placeholder="select#dropdown"
          prefix={<Target className="h-3 w-3 shrink-0 text-purple-500/70" />}
        />

        <NodeField label="Selected Option">
          <Badge variant="secondary" className="max-w-full truncate text-xs font-normal">
            {value || <span className="italic text-muted-foreground">None selected</span>}
          </Badge>
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