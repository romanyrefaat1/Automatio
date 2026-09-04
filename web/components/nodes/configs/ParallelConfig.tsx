"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import type { NodeConfigComponentProps } from "./index";

export default function ParallelConfig({
  config,
  onConfigChange,
}: NodeConfigComponentProps<"parallel">) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor="merge-variables">Merge branch variables</Label>
        <Switch
          id="merge-variables"
          checked={config.merge_variables === true}
          onCheckedChange={(checked) =>
            onConfigChange({
              ...config,
              merge_variables: checked,
            })
          }
        />
      </div>
      <p className="text-sm text-muted-foreground">
        When enabled, variables set inside each parallel branch are merged
        back into the workflow after all branches finish. Disabled by
        default.
      </p>
    </div>
  );
}