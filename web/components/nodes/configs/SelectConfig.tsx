"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
        <Input
          value={config.value ?? ""}
          onChange={(e) =>
            onConfigChange({
              ...config,
              value: e.target.value,
            })
          }
          placeholder="Egypt"
        />
      </div>
    </div>
  );
}