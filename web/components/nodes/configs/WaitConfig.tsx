"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { NodeConfigComponentProps } from "./index";

export default function WaitConfig({
  config,
  onConfigChange,
}: NodeConfigComponentProps<"wait">) {
  return (
    <div className="space-y-2">
      <Label>Duration (milliseconds)</Label>
      <Input
        type="number"
        min={0}
        value={config.milliseconds ?? ""}
        onChange={(e) =>
          onConfigChange({
            ...config,
            milliseconds: e.target.value
              ? Number(e.target.value)
              : undefined,
          })
        }
        placeholder="2000"
      />
    </div>
  );
}