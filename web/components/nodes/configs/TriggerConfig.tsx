"use client";

import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function TriggerConfig() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Trigger Type</Label>

        <Select defaultValue="manual">
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