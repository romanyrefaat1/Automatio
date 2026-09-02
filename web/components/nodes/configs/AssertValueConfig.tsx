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

/*
 * BEST GUESS — confirm field names against worker's
 * nodes/assert_value.ts implementation. Assumes this
 * asserts on a previously saved variable (e.g. from
 * extract_text / call_api / call_chatgpt's save_as),
 * as opposed to assert_text which reads live DOM text.
 */

export default function AssertValueConfig({
  config,
  onConfigChange,
}: NodeConfigComponentProps<"assert_value">) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Variable</Label>
        <Input
          value={config.variable ?? ""}
          onChange={(e) =>
            onConfigChange({
              ...config,
              variable: e.target.value,
            })
          }
          placeholder="username"
        />
      </div>

      <div className="space-y-2">
        <Label>Expected Value</Label>
        <Input
          value={config.expected ?? ""}
          onChange={(e) =>
            onConfigChange({
              ...config,
              expected: e.target.value,
            })
          }
          placeholder="admin"
        />
      </div>

      <div className="space-y-2">
        <Label>Operator</Label>

        <Select
          value={config.operator ?? "equals"}
          onValueChange={(value) =>
            onConfigChange({
              ...config,
              operator: value as
                | "equals"
                | "not_equals"
                | "contains"
                | "not_contains",
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="equals">Equals</SelectItem>
            <SelectItem value="not_equals">Does not equal</SelectItem>
            <SelectItem value="contains">Contains</SelectItem>
            <SelectItem value="not_contains">
              Does not contain
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}