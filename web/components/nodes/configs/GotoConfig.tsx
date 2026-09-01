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

export default function GotoConfig() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>URL</Label>
        <Input placeholder="https://example.com" />
      </div>

      <div className="space-y-2">
        <Label>Wait Until</Label>

        <Select defaultValue="load">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="load">Load</SelectItem>
            <SelectItem value="domcontentloaded">
              DOM Content Loaded
            </SelectItem>
            <SelectItem value="networkidle">Network Idle</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}