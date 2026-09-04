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

export default function AssertTextConfig({
  config,
  onConfigChange,
}: NodeConfigComponentProps<"assert_text">) {
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
          placeholder="h1"
        />
      </div>

      <div className="space-y-2">
        <Label>Expected Text</Label>
        <Input
          value={config.expected ?? ""}
          onChange={(e) =>
            onConfigChange({
              ...config,
              expected: e.target.value,
            })
          }
          placeholder="Welcome back"
        />
      </div>

      <div className="space-y-2">
        <Label>Match</Label>

        <Select
          value={config.match ?? "contains"}
          onValueChange={(value) =>
            onConfigChange({
              ...config,
              match: value as "exact" | "contains",
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="exact">Exact</SelectItem>
            <SelectItem value="contains">Contains</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Save As</Label>
        <Input
          value={config.save_as ?? ""}
          onChange={(e) =>
            onConfigChange({
              ...config,
              save_as: e.target.value
                ? e.target.value
                : undefined,
            })
          }
          placeholder="my_variable"
        />
        <p className="text-xs text-muted-foreground">
          Store this node's result in a variable you can reference later
          with {"{{"}my_variable{"}}"}.
        </p>
      </div>
    </div>
  );
}