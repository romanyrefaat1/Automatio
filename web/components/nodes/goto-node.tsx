/* web/components/nodes/goto-node.tsx */
"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Globe, Clock } from "lucide-react";

import type { AutomationNode } from "@/types/nodes";
import {
  NodeCard,
  NodeCodeField,
  NodeHeader,
  contentBase,
} from "./node-components";
import { Badge } from "@/components/ui/badge";

export function GotoNode({
  data,
  selected,
}: NodeProps<AutomationNode>) {
  const config = (data.config && typeof data.config === "object" && !Array.isArray(data.config)
    ? data.config
    : {}) as {
      url?: string;
      waitUntil?: "load" | "domcontentloaded" | "networkidle";
    };

  const url = config.url || (data.url as string | undefined) || "";
  const waitUntil = config.waitUntil || "load";

  const waitUntilLabels: Record<string, string> = {
    load: "Load",
    domcontentloaded: "DOM Content Loaded",
    networkidle: "Network Idle",
  };

  return (
    <NodeCard selected={selected}>
      <NodeHeader
        icon={<Globe className="h-4 w-4" />}
        title={data.label || "Go to URL"}
        description={data.description || "Navigate browser"}
        typeBadge="GOTO"
        iconClass="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30"
        badgeClass="border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10"
      />

      <div className={contentBase}>
        <NodeCodeField
          label="URL"
          value={url}
          placeholder="https://example.com"
          prefix={<Globe className="h-3 w-3 shrink-0 text-blue-500/70" />}
        />

        <div className="space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Wait Until
          </div>
          <Badge variant="outline" className="flex items-center gap-1 text-[11px] font-normal text-foreground">
            <Clock className="h-3 w-3 text-muted-foreground" />
            <span>{waitUntilLabels[waitUntil] ?? waitUntil}</span>
          </Badge>
        </div>
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