/* web/app/(app-screens)/builder/components/InputVariables.tsx */
"use client";

import { useMemo, useState } from "react";
import { Check, Variable } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import type { Tables } from "@/types/supabase-auto";
import { useAutomationContext } from "../contexts/AutomationContext";

type AutomationStep = Tables<"automation_steps">;

type VariableSelectorProps = {
  value: string;
  onValueChange: (value: string) => void;

  placeholder?: string;
  disabled?: boolean;
  className?: string;

  /**
   * Controls what gets stored in the parent value.
   *
   * Default:
   * "{{username}}"
   */
  formatVariable?: (saveAs: string) => string;
};

export function VariableSelector({
  value,
  onValueChange,
  placeholder = "Select a variable...",
  disabled = false,
  className,
  formatVariable = (saveAs) => `{{${saveAs}}}`,
}: VariableSelectorProps) {
  const { automationVariables } = useAutomationContext();

  const [open, setOpen] = useState(false);

  const variables = useMemo(() => {
    return automationVariables.filter((step) => {
      const saveAs = getSaveAs(step);
      return Boolean(saveAs);
    });
  }, [automationVariables]);

  const selectedVariable = variables.find((step) => {
    const saveAs = getSaveAs(step);

    if (!saveAs) {
      return false;
    }

    return formatVariable(saveAs) === value;
  });

  const selectedSaveAs = selectedVariable
    ? getSaveAs(selectedVariable)
    : null;

  const handleSelect = (step: AutomationStep) => {
    const saveAs = getSaveAs(step);

    if (!saveAs) {
      return;
    }

    onValueChange(formatVariable(saveAs));
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            "border-input bg-background ring-offset-background",
            "flex h-9 w-full items-center justify-between",
            "rounded-md border px-3 py-2 text-sm",
            "hover:bg-accent hover:text-accent-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:pointer-events-none disabled:opacity-50",
            className
          )}
        >
          <span
            className={cn(
              "flex min-w-0 items-center gap-2 truncate",
              !selectedSaveAs &&
                "text-muted-foreground"
            )}
          >
            <Variable className="size-4 shrink-0" />

            <span className="truncate">
              {selectedSaveAs
                ? formatVariable(selectedSaveAs)
                : placeholder}
            </span>
          </span>
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0"
      >
        {/*
          Command/CommandList handle Up/Down/Enter navigation
          natively via cmdk once focus is inside the list.
          Radix moves focus into PopoverContent automatically
          when it opens, and cmdk's <Command> wires roving focus
          + Enter-to-select for whatever item is highlighted —
          so no manual key handling is needed here.
        */}
        <Command>
          <CommandList>
            <CommandEmpty>
              No variables available.
            </CommandEmpty>

            {variables.length > 0 && (
              <CommandGroup heading="Variables">
                {variables.map((step) => {
                  const saveAs = getSaveAs(step);

                  if (!saveAs) {
                    return null;
                  }

                  const formattedValue =
                    formatVariable(saveAs);

                  const isSelected =
                    value === formattedValue;

                  return (
                    <CommandItem
                      key={step.id}
                      value={saveAs}
                      onSelect={() => handleSelect(step)}
                      className="cursor-pointer"
                    >
                      <Variable className="mr-2 size-4 shrink-0" />

                      <div className="flex min-w-0 flex-1 flex-col">
                        <span className="truncate font-medium">
                          {saveAs}
                        </span>

                        {step.title && (
                          <span className="text-muted-foreground truncate text-xs">
                            {step.title}
                          </span>
                        )}
                      </div>

                      <span className="text-muted-foreground ml-2 shrink-0 text-xs">
                        {formattedValue}
                      </span>

                      {isSelected && (
                        <Check className="ml-2 size-4 shrink-0" />
                      )}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function getSaveAs(
  step: AutomationStep
): string | null {
  const value = step.config?.save_as;

  if (
    typeof value !== "string" ||
    value.trim() === ""
  ) {
    return null;
  }

  return value;
}