/* web/app/(app-screens)/builder/components/InputAndTextareaWithVariablesSupport.tsx */
"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { Check, Variable } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

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

type VariableInputProps = {
  value: string;
  onValueChange: (value: string) => void;

  /**
   * Render as an input or textarea.
   */
  type?: "input" | "textarea";

  placeholder?: string;
  disabled?: boolean;
  className?: string;

  /**
   * Number of rows when using textarea.
   */
  rows?: number;

  /**
   * How a selected variable is written into the value.
   *
   * Default:
   * {{variableName}}
   */
  formatVariable?: (saveAs: string) => string;

  /**
   * Optional custom filter for available variables.
   */
  filterVariables?: (
    step: AutomationStep,
    search: string
  ) => boolean;
};

/**
 * Looks for an in-progress "{{partial" token that the cursor
 * is currently sitting inside of, anywhere in the text — not
 * just at the very start of the string.
 *
 * Returns the partial search term (text typed after "{{") and
 * the index where that "{{" starts, or null if the cursor
 * isn't inside an open "{{...}}" token.
 */
function findActiveVariableToken(
  text: string,
  cursorIndex: number
): { search: string; start: number } | null {
  const uptoCursor = text.slice(0, cursorIndex);

  const openIndex = uptoCursor.lastIndexOf("{{");

  if (openIndex === -1) {
    return null;
  }

  const between = uptoCursor.slice(openIndex + 2);

  // If the user already closed the token (typed "}}") before
  // the cursor, they're no longer inside a variable token.
  if (between.includes("}}")) {
    return null;
  }

  return {
    search: between.toLowerCase(),
    start: openIndex,
  };
}

export function InputOrTextareaWithVariablesSupport({
  value,
  onValueChange,
  type = "input",
  placeholder = "Enter a value...",
  disabled = false,
  className,
  rows = 4,
  formatVariable = (saveAs) => `{{${saveAs}}}`,
  filterVariables,
}: VariableInputProps) {
  const { automationVariables } = useAutomationContext();

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Where in `value` the currently-typed "{{partial" token
  // starts, so we know what to replace when a variable is
  // picked from the list.
  const activeTokenStartRef = useRef<number | null>(null);
  const cursorRef = useRef<number>(0);

  const variables = useMemo(() => {
    return automationVariables.filter((step) => {
      const saveAs = getSaveAs(step);

      if (!saveAs) {
        return false;
      }

      if (filterVariables) {
        return filterVariables(step, search);
      }

      return saveAs
        .toLowerCase()
        .includes(search);
    });
  }, [
    automationVariables,
    search,
    filterVariables,
  ]);

  // Keep the highlighted row in range whenever the filtered
  // list changes size (e.g. as the user narrows the search).
  useEffect(() => {
    setHighlightedIndex((current) => {
      if (variables.length === 0) {
        return 0;
      }

      return Math.min(current, variables.length - 1);
    });
  }, [variables.length]);

  const closeToken = () => {
    activeTokenStartRef.current = null;
    setOpen(false);
    setSearch("");
    setHighlightedIndex(0);
  };

  const selectVariableAt = (index: number) => {
    const step = variables[index];

    if (!step) {
      return;
    }

    const saveAs = getSaveAs(step);

    if (!saveAs) {
      return;
    }

    const formattedValue = formatVariable(saveAs);
    const tokenStart = activeTokenStartRef.current;
    const cursorIndex = cursorRef.current;

    if (tokenStart !== null) {
      // Replace the in-progress "{{partial" token with the
      // fully formatted variable, preserving surrounding text.
      const before = value.slice(0, tokenStart);
      const after = value.slice(cursorIndex);

      onValueChange(`${before}${formattedValue}${after}`);
    } else {
      const before = value.slice(0, cursorIndex);
      const after = value.slice(cursorIndex);

      onValueChange(`${before}${formattedValue}${after}`);
    }

    closeToken();
  };

  const handleChange = (
    event: ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    const nextValue = event.target.value;
    const cursorIndex =
      event.target.selectionStart ?? nextValue.length;

    onValueChange(nextValue);
    cursorRef.current = cursorIndex;

    /*
     * Only show the popover while the cursor sits inside an
     * open "{{partial" token. Typing "}}" (or moving the
     * cursor outside the token) closes it again.
     *
     * Example:
     *
     * Hello {{use
     *
     * searches for:
     * use
     */
    const activeToken = findActiveVariableToken(
      nextValue,
      cursorIndex
    );

    if (activeToken) {
      activeTokenStartRef.current = activeToken.start;
      setSearch(activeToken.search);
      setHighlightedIndex(0);
      setOpen(true);
    } else {
      closeToken();
    }
  };

  const handleKeyDown = (
    event: KeyboardEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    if (open) {
      if (event.key === "ArrowDown") {
        event.preventDefault();

        setHighlightedIndex((current) =>
          variables.length === 0
            ? 0
            : (current + 1) % variables.length
        );

        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();

        setHighlightedIndex((current) =>
          variables.length === 0
            ? 0
            : (current - 1 + variables.length) %
              variables.length
        );

        return;
      }

      if (event.key === "Enter") {
        // Only hijack Enter when there's actually something to
        // pick — otherwise let it behave normally (e.g. newline
        // in a textarea).
        if (variables.length > 0) {
          event.preventDefault();
          selectVariableAt(highlightedIndex);
        }

        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        closeToken();
        return;
      }

      if (event.key === "Tab") {
        closeToken();
      }
    }

    // Keep cursor tracking accurate for arrow-key movement
    // through the text itself (when the popover isn't open, or
    // for keys we don't otherwise handle above).
    cursorRef.current =
      event.currentTarget.selectionStart ?? cursorRef.current;
  };

  const handleKeyUp = (
    event: KeyboardEvent<
      HTMLInputElement | HTMLTextAreaElement
    >
  ) => {
    cursorRef.current =
      event.currentTarget.selectionStart ?? cursorRef.current;
  };

  const handleClick = (
    event:
      | MouseEvent<HTMLInputElement>
      | MouseEvent<HTMLTextAreaElement>
  ) => {
    cursorRef.current =
      event.currentTarget.selectionStart ?? cursorRef.current;

    // Clicking around can move the cursor outside the active
    // token (or into a different one) without firing onChange —
    // recheck.
    const activeToken = findActiveVariableToken(
      value,
      cursorRef.current
    );

    if (activeToken) {
      activeTokenStartRef.current = activeToken.start;
      setSearch(activeToken.search);
      setOpen(true);
    } else {
      closeToken();
    }
  };

  const field = (
    type === "textarea" ? (
      <Textarea
        value={value}
        onChange={handleChange}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={cn(
          "pr-9",
          className
        )}
      />
    ) : (
      <Input
        value={value}
        onChange={handleChange}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onKeyUp={handleKeyUp}
        placeholder={placeholder}
        disabled={disabled}
        className={cn(
          "pr-9",
          className
        )}
      />
    )
  );

  return (
    <Popover
      open={open}
      onOpenChange={(nextOpen) => {
        // The popover only opens/closes as a result of typing
        // "{{" / "}}" (see handleChange/handleClick above), not
        // from focus or outside interactions triggering Radix's
        // own open state directly — but we still respect an
        // explicit close (e.g. clicking outside).
        if (!nextOpen) {
          closeToken();
        }
      }}
    >
      <PopoverTrigger asChild>
        <div className="relative">
          {field}

          <Variable
            className={cn(
              "text-muted-foreground pointer-events-none absolute right-3 size-4",
              type === "textarea"
                ? "top-3"
                : "top-1/2 -translate-y-1/2"
            )}
          />
        </div>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {/*
          shouldFilter=false: filtering is already done above
          against the corrected `search` token. Focus never
          moves into this list (the user keeps typing in the
          field), so highlighting is driven manually via
          `highlightedIndex` + `data-selected`, and Enter/Up/Down
          are handled in the field's own onKeyDown.
        */}
        <Command shouldFilter={false}>
          <CommandList>
            <CommandEmpty>
              No variables found.
            </CommandEmpty>

            {variables.length > 0 && (
              <CommandGroup heading="Variables">
                {variables.map((step, index) => {
                  const saveAs = getSaveAs(step);

                  if (!saveAs) {
                    return null;
                  }

                  const formattedValue =
                    formatVariable(saveAs);

                  const isSelected =
                    value === formattedValue;

                  const isHighlighted =
                    index === highlightedIndex;

                  return (
                    <CommandItem
                      key={step.id}
                      value={saveAs}
                      data-selected={isHighlighted}
                      onMouseEnter={() =>
                        setHighlightedIndex(index)
                      }
                      onSelect={() =>
                        selectVariableAt(index)
                      }
                      className={cn(
                        "cursor-pointer",
                        isHighlighted &&
                          "bg-accent text-accent-foreground"
                      )}
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