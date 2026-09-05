/* web/components/nodes/configs/LoopConfig.tsx */
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

import { VariableSelector } from "@/app/(app-screens)/builder/components/InputVariables";
import { InputOrTextareaWithVariablesSupport } from "@/app/(app-screens)/builder/components/InputAndTextareaWithVariablesSupport";

type ValueType =
  | "static"
  | "variable"
  | "text"
  | "input_value"
  | "attribute"
  | "url"
  | "title";

type ValueConfig = {
  type: ValueType;
  selector?: string;
  attribute?: string;
  name?: string;
  value?: string;
};

type LoopCondition = {
  left: ValueConfig;
  operator:
    | "is"
    | "is_not"
    | "contains"
    | "not_contains"
    | "starts_with"
    | "ends_with";
  right: ValueConfig;
};

type LoopConfig = {
  max_iterations?: number;
  condition: LoopCondition;
};

type Props = {
  config: Partial<LoopConfig>;
  onConfigChange: (config: LoopConfig) => void;
};

const defaultValue: ValueConfig = {
  type: "static",
  value: "",
};

function ValueEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: ValueConfig;
  onChange: (value: ValueConfig) => void;
}) {
  const needsSelector =
    value.type === "text" ||
    value.type === "input_value" ||
    value.type === "attribute";

  return (
    <div className="space-y-3">
      <Label>{label}</Label>

      <Select
        value={value.type}
        onValueChange={(type) => {
          const next: ValueConfig = {
            type: type as ValueType,
          };

          if (type === "static") {
            next.value = "";
          }

          if (type === "variable") {
            next.name = "";
          }

          if (
            type === "text" ||
            type === "input_value" ||
            type === "attribute"
          ) {
            next.selector = "";
          }

          if (type === "attribute") {
            next.attribute = "";
          }

          onChange(next);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>

        <SelectContent>
          <SelectItem value="static">
            Static Value
          </SelectItem>

          <SelectItem value="variable">
            Variable
          </SelectItem>

          <SelectItem value="text">
            Page Text
          </SelectItem>

          <SelectItem value="input_value">
            Input Value
          </SelectItem>

          <SelectItem value="attribute">
            DOM Attribute
          </SelectItem>

          <SelectItem value="url">
            Page URL
          </SelectItem>

          <SelectItem value="title">
            Page Title
          </SelectItem>
        </SelectContent>
      </Select>

      {value.type === "static" && (
        <InputOrTextareaWithVariablesSupport
          type="input"
          value={value.value ?? ""}
          onValueChange={(nextValue) =>
            onChange({
              ...value,
              value: nextValue,
            })
          }
          placeholder="Value"
        />
      )}

      {value.type === "variable" && (
        <VariableSelector
          value={value.name ?? ""}
          onValueChange={(name) =>
            onChange({
              ...value,
              name,
            })
          }
          placeholder="Select a variable..."
        />
      )}

      {needsSelector && (
        <Input
          placeholder="CSS Selector"
          value={value.selector ?? ""}
          onChange={(e) =>
            onChange({
              ...value,
              selector: e.target.value,
            })
          }
        />
      )}

      {value.type === "attribute" && (
        <Input
          placeholder="Attribute name"
          value={value.attribute ?? ""}
          onChange={(e) =>
            onChange({
              ...value,
              attribute: e.target.value,
            })
          }
        />
      )}
    </div>
  );
}

export default function LoopConfig({
  config,
  onConfigChange,
}: Props) {
  const condition: LoopCondition =
    config.condition ?? {
      left: {
        ...defaultValue,
      },
      operator: "is",
      right: {
        ...defaultValue,
      },
    };

  const completeConfig: LoopConfig = {
    ...config,
    condition,
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-2">
        <Label htmlFor="loop-max-iterations">
          Max Iterations
        </Label>

        <Input
          id="loop-max-iterations"
          type="number"
          min={1}
          placeholder="10"
          value={completeConfig.max_iterations ?? ""}
          onChange={(e) => {
            const value = e.target.value;

            onConfigChange({
              ...completeConfig,
              max_iterations:
                value === ""
                  ? undefined
                  : Number(value),
            });
          }}
        />
      </div>

      <div className="rounded-lg border p-4">
        <div className="mb-4">
          <Label>Loop Condition</Label>

          <p className="mt-1 text-xs text-muted-foreground">
            The loop continues while this condition is true.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <ValueEditor
            label="Compare From"
            value={condition.left}
            onChange={(left) =>
              onConfigChange({
                ...completeConfig,
                condition: {
                  ...condition,
                  left,
                },
              })
            }
          />

          <div className="space-y-2">
            <Label>Operator</Label>

            <Select
              value={condition.operator}
              onValueChange={(operator) =>
                onConfigChange({
                  ...completeConfig,
                  condition: {
                    ...condition,
                    operator:
                      operator as LoopCondition["operator"],
                  },
                })
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="is">
                  Is
                </SelectItem>

                <SelectItem value="is_not">
                  Is Not
                </SelectItem>

                <SelectItem value="contains">
                  Contains
                </SelectItem>

                <SelectItem value="not_contains">
                  Does Not Contain
                </SelectItem>

                <SelectItem value="starts_with">
                  Starts With
                </SelectItem>

                <SelectItem value="ends_with">
                  Ends With
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ValueEditor
            label="Compare With"
            value={condition.right}
            onChange={(right) =>
              onConfigChange({
                ...completeConfig,
                condition: {
                  ...condition,
                  right,
                },
              })
            }
          />
        </div>
      </div>
    </div>
  );
}