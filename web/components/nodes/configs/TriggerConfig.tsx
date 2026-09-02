"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { NodeConfigComponentProps } from "./index";

export default function TriggerConfig({
  config,
  onConfigChange,
}: NodeConfigComponentProps<"trigger">) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Trigger Type</Label>

        <Select
          value={config.triggerType ?? "manual"}
          onValueChange={(value) =>
            onConfigChange({
              ...config,
              triggerType: value as "manual" | "schedule",
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select trigger type" />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="manual">Manual</SelectItem>
            <SelectItem value="schedule">Schedule</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}