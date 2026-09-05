/* web/components/nodes/configs/GotoConfig.tsx */
"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { InputOrTextareaWithVariablesSupport } from "@/app/(app-screens)/builder/components/InputAndTextareaWithVariablesSupport";

import type { NodeConfigComponentProps } from "./index";

type WaitUntil =
  | "load"
  | "domcontentloaded"
  | "networkidle";

export default function GotoConfig({
  config,
  onConfigChange,
}: NodeConfigComponentProps<"goto">) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>URL</Label>

        <InputOrTextareaWithVariablesSupport
          type="input"
          value={config.url ?? ""}
          onValueChange={(value) =>
            onConfigChange({
              ...config,
              url: value,
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
              waitUntil: value as WaitUntil,
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="load">
              Load
            </SelectItem>

            <SelectItem value="domcontentloaded">
              DOM Content Loaded
            </SelectItem>

            <SelectItem value="networkidle">
              Network Idle
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}