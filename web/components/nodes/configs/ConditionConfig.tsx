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
import type { ConditionConfig as ConditionConfigType } from "@/types/automation-rules";

/*
 * ConditionConfig is a discriminated union keyed on `source`.
 * Each source shape has different fields (element uses
 * `selector` + `exists`/`not_exists`; the rest use
 * `value` + a comparison operator). We keep one flat local
 * shape while editing, then narrow into the right union
 * member when reporting the change upward.
 */

type ConditionSource = ConditionConfigType["source"];

export default function ConditionConfig({
  config,
  onConfigChange,
}: NodeConfigComponentProps<"condition">) {
  const source: ConditionSource = config.source ?? "url";

  const isElementSource = source === "element";

  const operator =
    "operator" in config ? config.operator : undefined;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Source</Label>

        <Select
          value={source}
          onValueChange={(value) => {
            const nextSource = value as ConditionSource;

            if (nextSource === "element") {
              onConfigChange({
                source: "element",
                selector:
                  "selector" in config ? config.selector ?? "" : "",
                operator: "exists",
              });
            } else if (nextSource === "variable") {
              onConfigChange({
                source: "variable",
                variable:
                  "variable" in config ? config.variable ?? "" : "",
                operator: "contains",
                value: "value" in config ? config.value ?? "" : "",
              });
            } else {
              onConfigChange({
                source: nextSource,
                operator: "contains",
                value: "value" in config ? config.value ?? "" : "",
              });
            }
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="url">Page URL</SelectItem>
            <SelectItem value="text">Page Text</SelectItem>
            <SelectItem value="variable">Variable</SelectItem>
            <SelectItem value="element">Element</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {source === "variable" && (
        <div className="space-y-2">
          <Label>Variable</Label>
          <Input
            value={"variable" in config ? config.variable ?? "" : ""}
            onChange={(e) =>
              onConfigChange({
                ...config,
                source: "variable",
                variable: e.target.value,
              } as ConditionConfigType)
            }
            placeholder="pageTitle"
          />
        </div>
      )}

      {isElementSource ? (
        <div className="space-y-2">
          <Label>Selector</Label>
          <Input
            value={"selector" in config ? config.selector ?? "" : ""}
            onChange={(e) =>
              onConfigChange({
                ...config,
                source: "element",
                selector: e.target.value,
              } as ConditionConfigType)
            }
            placeholder="#dashboard"
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label>Value</Label>
          <Input
            value={"value" in config ? config.value ?? "" : ""}
            onChange={(e) =>
              onConfigChange({
                ...config,
                value: e.target.value,
              } as ConditionConfigType)
            }
            placeholder="Enter value..."
          />
        </div>
      )}

      <div className="space-y-2">
        <Label>Operator</Label>

        <Select
          value={operator ?? (isElementSource ? "exists" : "contains")}
          onValueChange={(value) =>
            onConfigChange({
              ...config,
              operator: value,
            } as ConditionConfigType)
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            {isElementSource ? (
              <>
                <SelectItem value="exists">Exists</SelectItem>
                <SelectItem value="not_exists">Does not exist</SelectItem>
              </>
            ) : (
              <>
                <SelectItem value="equals">Equals</SelectItem>
                <SelectItem value="not_equals">Does not equal</SelectItem>
                <SelectItem value="contains">Contains</SelectItem>
                <SelectItem value="not_contains">
                  Does not contain
                </SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}