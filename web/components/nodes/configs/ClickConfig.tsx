"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { NodeConfigComponentProps } from "./index";

export default function ClickConfig({
  config,
  onConfigChange,
}: NodeConfigComponentProps<"click">) {
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
          placeholder="#login-button"
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

      <div className="space-y-2">
        <Label>Click</Label>

        <Select
          value={config.button ?? "left"}
          onValueChange={(value) =>
            onConfigChange({
              ...config,
              button: value as "left" | "right" | "middle",
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="left">Left Click</SelectItem>
            <SelectItem value="middle">Middle Click</SelectItem>
            <SelectItem value="right">Right Click</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}