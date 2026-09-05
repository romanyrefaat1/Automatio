/* web/components/nodes/parallel-node.tsx */
"use client";

import {
  Handle,
  Position,
  useNodeConnections,
  useUpdateNodeInternals,
  type NodeProps,
} from "@xyflow/react";
import { useEffect } from "react";
import { GitFork, Split, Layers } from "lucide-react";

import type { AutomationNode } from "@/types/nodes";
import {
  NodeCard,
  NodeHeader,
  contentBase,
} from "./node-components";
import { Badge } from "@/components/ui/badge";

export function ParallelNode({
  id,
  data,
  selected,
}: NodeProps<AutomationNode>) {
  const config = (data.config && typeof data.config === "object" && !Array.isArray(data.config)
    ? data.config
    : {}) as {
      merge_variables?: boolean;
    };

  const outgoingConnections = useNodeConnections({
    handleType: "source",
  });

  const connectedBranchCount = outgoingConnections.length;
  const handleCount = connectedBranchCount === 0 ? 2 : connectedBranchCount + 1;

  const updateNodeInternals = useUpdateNodeInternals();

  useEffect(() => {
    updateNodeInternals(id);
  }, [id, handleCount, updateNodeInternals]);

  const mergeVariables = config.merge_variables === true;

  return (
    <NodeCard selected={selected}>
      <NodeHeader
        icon={<GitFork className="h-4 w-4" />}
        title={data.label || "Parallel"}
        description={data.description || "Run branches concurrently"}
        typeBadge="PARALLEL"
        iconClass="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30"
        badgeClass="border-indigo-500/30 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10"
      />

      <div className={contentBase}>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="flex items-center gap-1 text-[11px] font-medium">
            <Split className="h-3 w-3 text-indigo-500" />
            <span>{connectedBranchCount} active {connectedBranchCount === 1 ? "branch" : "branches"}</span>
          </Badge>

          <Badge variant="outline" className="text-[11px]">
            {mergeVariables ? "Merge variables" : "Isolated variables"}
          </Badge>
        </div>

        <div className="text-[11px] text-muted-foreground leading-relaxed">
          {mergeVariables
            ? "Branch variables merge back into workflow."
            : "Branch variables stay isolated to their paths."}
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        id="input"
      />

      {Array.from({ length: handleCount }).map((_, index) => {
        const leftPercent =
          handleCount === 1
            ? 50
            : ((index + 1) / (handleCount + 1)) * 100;

        return (
          <Handle
            key={index}
            type="source"
            position={Position.Bottom}
            id={`branch-${index}`}
            style={{
              left: `${leftPercent}%`,
            }}
            className="!bg-indigo-500 !border-indigo-700"
          />
        );
      })}
    </NodeCard>
  );
}