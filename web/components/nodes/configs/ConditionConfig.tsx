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

type ConditionConfig = {
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

type Props = {
  config: Partial<ConditionConfig>;
  onConfigChange: (config: ConditionConfig) => void;
};

const defaultValue: ValueConfig = {
  type: "static",
  value: "",
};

const valueTypes: {
  value: ValueType;
  label: string;
}[] = [
  {
    value: "static",
    label: "Static Value",
  },
  {
    value: "variable",
    label: "Variable",
  },
  {
    value: "text",
    label: "Page Text",
  },
  {
    value: "input_value",
    label: "Input Value",
  },
  {
    value: "attribute",
    label: "DOM Attribute",
  },
  {
    value: "url",
    label: "Page URL",
  },
  {
    value: "title",
    label: "Page Title",
  },
];

function ValueEditor({
  side,
  value,
  onChange,
}: {
  side: "left" | "right";
  value: ValueConfig;
  onChange: (value: ValueConfig) => void;
}) {
  const needsSelector =
    value.type === "text" ||
    value.type === "input_value" ||
    value.type === "attribute";

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <Label>
        {side === "left"
          ? "Compare From"
          : "Compare With"}
      </Label>

      <Select
        value={value.type}
        onValueChange={(type) => {
          const newValue: ValueConfig = {
            type: type as ValueType,
          };

          // Preserve nothing when switching source types.
          // This prevents stale selector/name/value data.
          if (type === "static") {
            newValue.value = "";
          }

          if (type === "variable") {
            newValue.name = "";
          }

          if (
            type === "text" ||
            type === "input_value" ||
            type === "attribute"
          ) {
            newValue.selector = "";
          }

          if (type === "attribute") {
            newValue.attribute = "";
          }

          onChange(newValue);
        }}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>

        <SelectContent>
          {valueTypes.map((item) => (
            <SelectItem
              key={item.value}
              value={item.value}
            >
              {item.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {value.type === "static" && (
        <div className="space-y-2">
          <Label>Value</Label>

          <Input
            placeholder="Enter value"
            value={value.value ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                value: e.target.value,
              })
            }
          />
        </div>
      )}

      {value.type === "variable" && (
        <div className="space-y-2">
          <Label>Variable Name</Label>

          <Input
            placeholder="e.g. currentStatus"
            value={value.name ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                name: e.target.value,
              })
            }
          />
        </div>
      )}

      {needsSelector && (
        <div className="space-y-2">
          <Label>CSS Selector</Label>

          <Input
            placeholder=".status"
            value={value.selector ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                selector: e.target.value,
              })
            }
          />
        </div>
      )}

      {value.type === "attribute" && (
        <div className="space-y-2">
          <Label>Attribute Name</Label>

          <Input
            placeholder="href"
            value={value.attribute ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                attribute: e.target.value,
              })
            }
          />
        </div>
      )}
    </div>
  );
}

export default function ConditionConfig({
  config,
  onConfigChange,
}: Props) {
  const completeConfig: ConditionConfig = {
    left: config.left ?? {
      ...defaultValue,
    },

    operator: config.operator ?? "is",

    right: config.right ?? {
      ...defaultValue,
    },
  };

  const updateLeft = (left: ValueConfig) => {
    onConfigChange({
      ...completeConfig,
      left,
    });
  };

  const updateRight = (right: ValueConfig) => {
    onConfigChange({
      ...completeConfig,
      right,
    });
  };

  const updateOperator = (
    operator: ConditionConfig["operator"]
  ) => {
    onConfigChange({
      ...completeConfig,
      operator,
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <ValueEditor
        side="left"
        value={completeConfig.left}
        onChange={updateLeft}
      />

      <div className="space-y-2">
        <Label>Operator</Label>

        <Select
          value={completeConfig.operator}
          onValueChange={(value) =>
            updateOperator(
              value as ConditionConfig["operator"]
            )
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
        side="right"
        value={completeConfig.right}
        onChange={updateRight}
      />
    </div>
  );
}