/* web/components/nodes/configs/SelectConfig.tsx */
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { InputOrTextareaWithVariablesSupport } from "@/app/(app-screens)/builder/components/InputAndTextareaWithVariablesSupport";

import type { NodeConfigComponentProps } from "./index";

export default function SelectConfig({
  config,
  onConfigChange,
}: NodeConfigComponentProps<"select">) {
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
          placeholder="select[name='country']"
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
          placeholder="Egypt"
        />
      </div>
    </div>
  );
}