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
 * nodes/loop.ts implementation. Currently assumes a loop
 * can iterate over matched elements (selector), a fixed
 * count, or a comma-separated list, storing the current
 * item in `variable` on each iteration.
 */

export default function LoopConfig({
  config,
  onConfigChange,
}: NodeConfigComponentProps<"loop">) {
  const mode = config.mode ?? "selector";

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Loop Over</Label>

        <Select
          value={mode}
          onValueChange={(value) =>
            onConfigChange({
              ...config,
              mode: value as "selector" | "count" | "list",
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="selector">Matched elements</SelectItem>
            <SelectItem value="count">Fixed count</SelectItem>
            <SelectItem value="list">List of values</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {mode === "selector" && (
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
            placeholder=".list-item"
          />
        </div>
      )}

      {mode === "count" && (
        <div className="space-y-2">
          <Label>Count</Label>
          <Input
            type="number"
            min={0}
            value={config.count ?? ""}
            onChange={(e) =>
              onConfigChange({
                ...config,
                count: e.target.value
                  ? Number(e.target.value)
                  : undefined,
              })
            }
            placeholder="5"
          />
        </div>
      )}

      {mode === "list" && (
        <div className="space-y-2">
          <Label>Values (comma-separated)</Label>
          <Input
            value={config.list ?? ""}
            onChange={(e) =>
              onConfigChange({
                ...config,
                list: e.target.value,
              })
            }
            placeholder="a, b, c"
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Save Current Item As</Label>
        <Input
          value={config.variable ?? ""}
          onChange={(e) =>
            onConfigChange({
              ...config,
              variable: e.target.value,
            })
          }
          placeholder="item"
        />
      </div>
    </div>
  );
}