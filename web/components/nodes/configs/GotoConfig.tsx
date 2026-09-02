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

export default function GotoConfig({
  config,
  onConfigChange,
}: NodeConfigComponentProps<"goto">) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>URL</Label>
        <Input
          value={config.url ?? ""}
          onChange={(e) =>
            onConfigChange({
              ...config,
              url: e.target.value,
            })
          }
          placeholder="https://example.com"
        />
      </div>

      <div className="space-y-2">
        <Label>Wait Until</Label>

        <Select
          value={config.waitUntil ?? "load"}
          onValueChange={(value) =>
            onConfigChange({
              ...config,
              waitUntil: value as
                | "load"
                | "domcontentloaded"
                | "networkidle",
            })
          }
        >
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