/* web/components/nodes/call-chatgpt-node.tsx */
"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Bot, Sparkles } from "lucide-react";

import type { AutomationNode } from "@/types/nodes";
import {
  NodeCard,
  NodeField,
  NodeHeader,
  NodeVariablePill,
  contentBase,
} from "./node-components";

export function CallChatGPTNode({
  data,
  selected,
}: NodeProps<AutomationNode>) {
  const config = (data.config && typeof data.config === "object" && !Array.isArray(data.config)
    ? data.config
    : {}) as {
      query?: string;
      save_as?: string;
    };

  const query = config.query || "";
  const saveAs = config.save_as;

  return (
    <NodeCard selected={selected}>
      <NodeHeader
        icon={<Bot className="h-4 w-4" />}
        title={data.label || "Call ChatGPT"}
        description={data.description || "Run an AI intelligence request"}
        typeBadge="AI"
        iconClass="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
        badgeClass="border-emerald-500/30 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
      />

      <div className={contentBase}>
        <NodeField label="Prompt">
          <div className="rounded-md border border-border/60 bg-muted/40 px-2.5 py-2 text-xs text-foreground line-clamp-3">
            {query || <span className="italic text-muted-foreground">Summarize the page content...</span>}
          </div>
        </NodeField>

        {saveAs ? (
          <NodeField label="Save Output As">
            <div className="pt-0.5">
              <NodeVariablePill name={saveAs} />
            </div>
          </NodeField>
        ) : (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-0.5">
            <Sparkles className="h-3 w-3 text-emerald-500 shrink-0" />
            <span>AI response generated</span>
          </div>
        )}
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