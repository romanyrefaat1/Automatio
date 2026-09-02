"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { NodeConfigComponentProps } from "./index";

export default function CheckConfig({
  config,
  onConfigChange,
}: NodeConfigComponentProps<"check">) {
  return (
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
        placeholder="input[type='checkbox']"
      />
    </div>
  );
}