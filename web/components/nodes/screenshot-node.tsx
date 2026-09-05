/* web/components/nodes/screenshot-node.tsx */
"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Camera, Check, Sparkles } from "lucide-react";

import type { AutomationNode } from "@/types/nodes";
import {
  NodeCard,
  NodeHeader,
  contentBase,
} from "./node-components";
import { Badge } from "@/components/ui/badge";

export function ScreenshotNode({
  data,
  selected,
}: NodeProps<AutomationNode>) {
  const config = (data.config && typeof data.config === "object" && !Array.isArray(data.config)
    ? data.config
    : {}) as {
      fullPage?: boolean;
    };

  const isFullPage = Boolean(config.fullPage);

  return (
    <NodeCard selected={selected}>
      <NodeHeader
        icon={<Camera className="h-4 w-4" />}
        title={data.label || "Screenshot"}
        description={data.description || "Capture page image"}
        typeBadge="SCREENSHOT"
        iconClass="bg-pink-500/15 text-pink-600 dark:text-pink-400 border-pink-500/30"
        badgeClass="border-pink-500/30 text-pink-600 dark:text-pink-400 bg-pink-500/10"
      />

      <div className={contentBase}>
        <div className="space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Capture Scope
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={isFullPage ? "default" : "secondary"}
              className="text-[11px]"
            >
              {isFullPage ? "Full Page Screenshot" : "Viewport Only"}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-0.5">
          <Sparkles className="h-3 w-3 text-pink-500 shrink-0" />
          <span>Saved to execution artifacts</span>
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