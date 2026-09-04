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
 * Updated LoopConfig: 
 * Prevents orphaned JSON keys by explicitly constructing the state object 
 * based on the selected mode, dropping irrelevant fields (e.g., removing 'count'
 * when switching to 'list').
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
          onValueChange={(value) => {
            const nextMode = value as "selector" | "count" | "list";
            
            // Preserve the 'variable' state across mode switches
            const currentVariable = config.variable;

            if (nextMode === "selector") {
              onConfigChange({
                mode: "selector",
                selector: "selector" in config ? config.selector ?? "" : "",
                variable: currentVariable,
              });
            } else if (nextMode === "count") {
              onConfigChange({
                mode: "count",
                count: "count" in config ? config.count : undefined,
                variable: currentVariable,
              });
            } else if (nextMode === "list") {
              onConfigChange({
                mode: "list",
                list: "list" in config ? config.list ?? "" : "",
                variable: currentVariable,
              });
            }
          }}
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
            value={"selector" in config ? config.selector ?? "" : ""}
            onChange={(e) =>
              onConfigChange({
                ...config,
                mode: "selector",
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
            value={"count" in config ? config.count ?? "" : ""}
            onChange={(e) =>
              onConfigChange({
                ...config,
                mode: "count",
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
            value={"list" in config ? config.list ?? "" : ""}
            onChange={(e) =>
              onConfigChange({
                ...config,
                mode: "list",
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