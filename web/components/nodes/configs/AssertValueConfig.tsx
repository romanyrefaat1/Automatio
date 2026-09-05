/* web/components/nodes/configs/AssertValueConfig.tsx */
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { VariableSelector } from "@/app/(app-screens)/builder/components/InputVariables";
import { InputOrTextareaWithVariablesSupport } from "@/app/(app-screens)/builder/components/InputAndTextareaWithVariablesSupport";

type Config = {
  variable?: string;
  selector?: string;
  expected?: string;
  match?: "exact" | "contains";
  save_as?: string;
};

type Props = {
  config: Config;
  onConfigChange: (config: Config) => void;
};

export default function AssertTextConfig({
  config,
  onConfigChange,
}: Props) {
  const isVariableMode =
    Object.prototype.hasOwnProperty.call(config, "variable");

  const handleModeToggle = (mode: string) => {
    if (mode === "variable") {
      onConfigChange({
        ...config,
        variable: config.variable ?? "",
        selector: undefined,
      });
      return;
    }

    onConfigChange({
      ...config,
      selector: config.selector ?? "",
      variable: undefined,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="space-y-2">
        <Label>Source</Label>

        <RadioGroup
          value={isVariableMode ? "variable" : "selector"}
          onValueChange={handleModeToggle}
          className="flex gap-6"
        >
          <div className="flex items-center gap-2">
            <RadioGroupItem
              value="selector"
              id="assert-text-selector"
            />
            <Label
              htmlFor="assert-text-selector"
              className="cursor-pointer font-normal"
            >
              DOM Selector
            </Label>
          </div>

          <div className="flex items-center gap-2">
            <RadioGroupItem
              value="variable"
              id="assert-text-variable"
            />
            <Label
              htmlFor="assert-text-variable"
              className="cursor-pointer font-normal"
            >
              Variable
            </Label>
          </div>
        </RadioGroup>
      </div>

      {isVariableMode ? (
        <div className="space-y-2">
          <Label htmlFor="assert-text-variable-input">
            Variable
          </Label>

          <VariableSelector
            value={config.variable ?? ""}
            onValueChange={(value) =>
              onConfigChange({
                ...config,
                variable: value,
              })
            }
            placeholder="Select a variable..."
          />
        </div>
      ) : (
        <div className="space-y-2">
          <Label htmlFor="assert-text-selector-input">
            CSS Selector
          </Label>

          <Input
            id="assert-text-selector-input"
            placeholder=".my-element"
            value={config.selector ?? ""}
            onChange={(e) =>
              onConfigChange({
                ...config,
                selector: e.target.value,
              })
            }
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="assert-text-expected">
          Expected Value
        </Label>

        <InputOrTextareaWithVariablesSupport
          type="input"
          value={config.expected ?? ""}
          onValueChange={(value) =>
            onConfigChange({
              ...config,
              expected: value,
            })
          }
          placeholder="Expected value"
        />
      </div>

      <div className="space-y-2">
        <Label>Match</Label>

        <Select
          value={config.match ?? "exact"}
          onValueChange={(value: "exact" | "contains") =>
            onConfigChange({
              ...config,
              match: value,
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="exact">
              Exact Match
            </SelectItem>
            <SelectItem value="contains">
              Contains
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="assert-text-save-as">
          Save Result As
        </Label>

        <Input
          id="assert-text-save-as"
          placeholder="Optional variable name"
          value={config.save_as ?? ""}
          onChange={(e) =>
            onConfigChange({
              ...config,
              save_as: e.target.value,
            })
          }
        />
      </div>
    </div>
  );
}