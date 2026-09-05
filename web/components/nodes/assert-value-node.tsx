/* web/components/nodes/assert-value-node.tsx */
"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { BadgeCheck, Target } from "lucide-react";

import type { AutomationNode } from "@/types/nodes";
import {
  NodeCard,
  NodeCodeField,
  NodeField,
  NodeHeader,
  NodeVariablePill,
  contentBase,
} from "./node-components";
import { Badge } from "@/components/ui/badge";

export function AssertValueNode({
  data,
  selected,
}: NodeProps<AutomationNode>) {
  const config = (data.config && typeof data.config === "object" && !Array.isArray(data.config)
    ? data.config
    : {}) as {
      selector?: string;
      variable?: string;
      expected?: string;
      match?: "exact" | "contains";
      save_as?: string;
    };

  const selector = config.selector || (data.selector as string | undefined);
  const variable = config.variable || (data.variable as string | undefined);
  const expected = config.expected !== undefined ? String(config.expected) : (data.expected ? String(data.expected) : "");
  const match = config.match || "exact";
  const saveAs = config.save_as || (data.save_as as string | undefined);

  return (
    <NodeCard selected={selected}>
      <NodeHeader
        icon={<BadgeCheck className="h-4 w-4" />}
        title={data.label || "Assert Value"}
        description={data.description || "Verify input field value"}
        typeBadge="ASSERT VALUE"
        iconClass="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
        badgeClass="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
      />

      <div className={contentBase}>
        {selector ? (
          <NodeCodeField
            label="Input Element"
            value={selector}
            placeholder="input#value"
            prefix={<Target className="h-3 w-3 shrink-0 text-emerald-500/70" />}
          />
        ) : variable ? (
          <NodeField label="Variable Source">
            <div className="pt-0.5">
              <NodeVariablePill name={variable} />
            </div>
          </NodeField>
        ) : (
          <NodeCodeField
            label="Target"
            value="None configured"
            placeholder="Select selector or variable"
          />
        )}

        <div className="flex items-center gap-2 pt-0.5">
          <Badge variant="outline" className="text-[11px] capitalize text-foreground">
            {match} match
          </Badge>

          {saveAs && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <span>Save:</span>
              <NodeVariablePill name={saveAs} />
            </div>
          )}
        </div>

        <NodeField label="Expected Value">
          <div className="rounded-md border border-border/60 bg-muted/40 px-2.5 py-1.5 text-xs text-foreground font-mono">
            {expected || <span className="italic text-muted-foreground">Empty expected value</span>}
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