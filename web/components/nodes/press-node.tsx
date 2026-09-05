/* web/components/nodes/press-node.tsx */
"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Keyboard, Target } from "lucide-react";

import type { AutomationNode } from "@/types/nodes";
import {
  NodeCard,
  NodeCodeField,
  NodeField,
  NodeHeader,
  contentBase,
} from "./node-components";

export function PressNode({
  data,
  selected,
}: NodeProps<AutomationNode>) {
  const config = (data.config && typeof data.config === "object" && !Array.isArray(data.config)
    ? data.config
    : {}) as {
      key?: string;
      selector?: string;
    };

  const key = config.key || (data.key as string | undefined) || "Enter";
  const selector = config.selector || (data.selector as string | undefined) || "body";

  return (
    <NodeCard selected={selected}>
      <NodeHeader
        icon={<Keyboard className="h-4 w-4" />}
        title={data.label || "Press Key"}
        description={data.description || "Send keyboard keypress"}
        typeBadge="PRESS"
        iconClass="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
        badgeClass="border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10"
      />

      <div className={contentBase}>
        <NodeField label="Key to Press">
          <div className="pt-0.5">
            <kbd className="inline-block rounded-md border border-border bg-muted/70 px-2.5 py-1 text-xs font-mono font-semibold shadow-sm text-foreground">
              {key}
            </kbd>
          </div>
        </NodeField>

        <NodeCodeField
          label="Target Element"
          value={selector}
          placeholder="body"
          prefix={<Target className="h-3 w-3 shrink-0 text-amber-500/70" />}
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
    </NodeCard>
  );
}