"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { NodeConfigComponentProps } from "./index";

export default function ExtractTextConfig({
  config,
  onConfigChange,
}: NodeConfigComponentProps<"extract_text">) {
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
          placeholder=".username"
        />
      </div>

      <div className="space-y-2">
        <Label>Save As</Label>
        <Input
          value={config.save_as ?? ""}
          onChange={(e) =>
            onConfigChange({
              ...config,
              save_as: e.target.value,
            })
          }
          placeholder="username"
        />
      </div>
    </div>
  );
}