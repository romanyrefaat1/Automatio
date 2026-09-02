"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { NodeConfigComponentProps } from "./index";

export default function PressConfig({
  config,
  onConfigChange,
}: NodeConfigComponentProps<"press">) {
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
          placeholder="input[name='search']"
        />
      </div>

      <div className="space-y-2">
        <Label>Key</Label>
        <Input
          value={config.key ?? ""}
          onChange={(e) =>
            onConfigChange({
              ...config,
              key: e.target.value,
            })
          }
          placeholder="Enter"
        />
      </div>
    </div>
  );
}