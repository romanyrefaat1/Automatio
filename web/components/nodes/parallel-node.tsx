"use client";

import {
  Handle,
  Position,
  useNodeConnections,
  useUpdateNodeInternals,
  type NodeProps,
} from "@xyflow/react";
import { useEffect } from "react";
import { GitFork } from "lucide-react";

import type { AutomationNode } from "@/types/nodes";
import {
  NodeField,
  NodeHeader,
  contentBase,
  nodeBase,
} from "./node-components";

export function ParallelNode({
  id,
  data,
}: NodeProps<AutomationNode>) {
  const config = data.config;

  const outgoingConnections = useNodeConnections({
    handleType: "source",
  });

  const connectedBranchCount =
    outgoingConnections.length;

  const handleCount =
    connectedBranchCount === 0
      ? connectedBranchCount + 2
      : connectedBranchCount + 1;

  const updateNodeInternals = useUpdateNodeInternals();

  /*
   * React Flow caches each handle's DOM position.
   * Whenever we change how many handles render (or
   * where they sit), we must tell React Flow to
   * recompute that cache, or dragging a new edge
   * onto/from a handle can silently fail.
   */
  useEffect(() => {
    updateNodeInternals(id);
  }, [id, handleCount, updateNodeInternals]);

  const mergeVariables =
    config?.merge_variables === true;

  return (
    <div className={nodeBase}>
      <NodeHeader
        icon={<GitFork className="h-4 w-4" />}
        title={data.label || "Parallel"}
        description="Run branches in parallel"
        iconClass="bg-indigo-500/10 text-indigo-500"
      />

      <div className={contentBase}>
        <NodeField
          label="Branches"
          value={String(connectedBranchCount)}
        />
        <NodeField
          label="Merge variables"
          value={mergeVariables ? "Yes" : "No"}
        />
        <p className="text-xs text-muted-foreground">
          {mergeVariables
            ? "Variables set inside each branch are merged back into the workflow once every branch finishes."
            : "Variables set inside branches stay isolated and won't affect the workflow after the branches finish."}
        </p>
      </div>

      <Handle
        type="target"
        position={Position.Top}
        id="input"
      />

      {Array.from({ length: handleCount }).map(
        (_, index) => {
          const leftPercent =
            handleCount === 1
              ? 50
              : ((index + 1) /
                  (handleCount + 1)) *
                100;

          return (
            <Handle
              key={index}
              type="source"
              position={Position.Bottom}
              id={`branch-${index}`}
              style={{
                left: `${leftPercent}%`,
              }}
            />
          );
        }
      )}
    </div>
  );
}