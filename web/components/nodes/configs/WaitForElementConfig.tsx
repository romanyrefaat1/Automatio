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

export default function WaitForElementConfig({
  config,
  onConfigChange,
}: NodeConfigComponentProps<"wait_for_element">) {
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
          placeholder="#dashboard"
        />
      </div>

      <div className="space-y-2">
        <Label>State</Label>

        <Select
          value={config.state ?? "visible"}
          onValueChange={(value) =>
            onConfigChange({
              ...config,
              state: value as
                | "attached"
                | "detached"
                | "visible"
                | "hidden",
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="attached">Attached</SelectItem>
            <SelectItem value="detached">Detached</SelectItem>
            <SelectItem value="visible">Visible</SelectItem>
            <SelectItem value="hidden">Hidden</SelectItem>
          </SelectContent>
        </Select>
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