/* web/components/nodes/assert-node.tsx */
"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ShieldCheck, Target } from "lucide-react";

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

export function AssertNode({
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
        icon={<ShieldCheck className="h-4 w-4" />}
        title={data.label || "Assert Text"}
        description={data.description || "Verify text content"}
        typeBadge="ASSERT TEXT"
        iconClass="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
        badgeClass="border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10"
      />

      <div className={contentBase}>
        {selector ? (
          <NodeCodeField
            label="DOM Target"
            value={selector}
            placeholder="h1"
            prefix={<Target className="h-3 w-3 shrink-0 text-amber-500/70" />}
          />
        ) : variable ? (
          <NodeField label="Variable Target">
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

        <NodeField label="Expected Text">
          <div className="rounded-md border border-border/60 bg-muted/40 px-2.5 py-1.5 text-xs text-foreground font-mono">
            {expected || <span className="italic text-muted-foreground">Empty expected text</span>}
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
