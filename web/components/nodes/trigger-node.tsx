"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Play } from "lucide-react";

import type { AutomationNode } from "@/types/nodes";
import {
  NodeField,
  NodeHeader,
  contentBase,
  nodeBase,
} from "./node-components";
import { Button } from "../ui/button";
import { useAutomationContext } from "@/app/(app-screens)/builder/contexts/AutomationContext";
import { AnimatedButton } from "../ui/animated-button";

export function TriggerNode({
  data,
}: NodeProps<AutomationNode>) {
  const config = data.config;
 const { automation } = useAutomationContext();

const handleRun = async () => {
  if (!automation?.id) {
    console.error("No automation selected");
    return;
  }

  try {
    const response = await fetch(
      `/api/automations/${automation.id}/run`,
      {
        method: "POST",
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to run automation");
    }

    console.log("Automation started:", data);
  } catch (error) {
    console.error("Run failed:", error);
  }
};

  return (
    <div className={nodeBase}>
      <NodeHeader
        icon={<Play className="h-4 w-4" />}
        title={data.label || "Trigger"}
        description="Start the automation"
        iconClass="bg-green-500/10 text-green-500"
      />

      <div className={contentBase}>
        <NodeField
          label="Config"
          value={
            config
              ? JSON.stringify(config)
              : "Automation trigger"
          }
        />
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
      />
      {/* <Button onClick={handleRun}>Run</Button> */}
      <AnimatedButton onClick={handleRun}>Run</AnimatedButton>
    </div>
  );
}