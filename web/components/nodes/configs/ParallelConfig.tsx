"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { NodeConfigComponentProps } from "./index";

/*
 * BEST GUESS. NOTE: "parallel" is defined in the DB enum
 * and AutomationStepConfigMap, but is not handled in the
 * worker dispatcher yet — this node will save fine but the
 * worker will throw "Unknown workflow node type" until
 * nodes/parallel.ts is added there.
 */

export default function ParallelConfig({
  config,
  onConfigChange,
}: NodeConfigComponentProps<"parallel">) {
  return (
    <div className="space-y-2">
      <Label>Branches</Label>
      <Input
        type="number"
        min={2}
        value={config.branches ?? ""}
        onChange={(e) =>
          onConfigChange({
            ...config,
            branches: e.target.value
              ? Number(e.target.value)
              : undefined,
          })
        }
        placeholder="2"
      />
    </div>
  );
}