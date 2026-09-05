/* web/components/nodes/configs/FillConfig.tsx */
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { InputOrTextareaWithVariablesSupport } from "@/app/(app-screens)/builder/components/InputAndTextareaWithVariablesSupport";

import type { NodeConfigComponentProps } from "./index";

export default function FillConfig({
  config,
  onConfigChange,
}: NodeConfigComponentProps<"fill">) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Selector</Label>
        <Input
          value={config.selector ?? ""}
          onChange={(e) =>
            onConfigChange({
              ...config,
              selector: e.target.value,
            })
          }
          placeholder="input[name='email']"
        />
      </div>

      <div className="space-y-2">
        <Label>Value</Label>
        <InputOrTextareaWithVariablesSupport
          type="input"
          value={config.value ?? ""}
          onValueChange={(value) =>
            onConfigChange({
              ...config,
              value,
            })
          }
          placeholder="Enter value..."
        />
      </div>

      <div className="space-y-2">
        <Label>Timeout</Label>
        <Input
          type="number"
          min={0}
          value={config.timeout ?? ""}
          onChange={(e) =>
            onConfigChange({
              ...config,
              timeout: e.target.value
                ? Number(e.target.value)
                : undefined,
            })
          }
          placeholder="10000"
        />
      </div>
    </div>
  );
}