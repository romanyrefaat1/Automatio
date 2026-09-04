"use client";

import { useEffect, useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { ScrollArea } from "@/components/ui/scroll-area";

type Shortcut = {
  keys: string[];
  description: string;
};

type ShortcutGroup = {
  title: string;
  shortcuts: Shortcut[];
};

const shortcutGroups: ShortcutGroup[] = [
  {
    title: "Editor",
    shortcuts: [
      {
        keys: ["Ctrl", "S"],
        description: "Save automation",
      },
      {
        keys: ["Ctrl", "Z"],
        description: "Undo last action",
      },
      {
        keys: ["Ctrl", "Shift", "Z"],
        description: "Redo last action",
      },
      {
        keys: ["Ctrl", "/"],
        description: "Open keyboard shortcuts",
      },
    ],
  },
  {
    title: "Canvas",
    shortcuts: [
      {
        keys: ["Click"],
        description: "Select a node or edge",
      },
      {
        keys: ["Ctrl", "Click"],
        description: "Delete an edge",
      },
      {
        keys: ["Alt", "Click"],
        description: "Cycle an edge's type",
      },
      {
        keys: ["Ctrl", "Shift", "L"],
        description: "Auto-layout the workflow",
      },
      {
        keys: ["Delete"],
        description: "Delete the selected node or edge",
      },
    ],
  },
];

function isMac() {
  if (typeof navigator === "undefined") {
    return false;
  }

  return navigator.platform
    .toLowerCase()
    .includes("mac");
}

function ShortcutKeys({
  keys,
}: {
  keys: string[];
}) {
  const mac = isMac();

  return (
    <div className="flex shrink-0 items-center gap-1">
      {keys.map((key, index) => {
        let displayKey = key;

        if (mac) {
          switch (key) {
            case "Ctrl":
              displayKey = "⌘";
              break;

            case "Shift":
              displayKey = "⇧";
              break;

            case "Alt":
              displayKey = "⌥";
              break;

            default:
              displayKey = key;
          }
        }

        return (
          <div
            key={`${key}-${index}`}
            className="flex items-center gap-1"
          >
            {index > 0 && (
              <span className="text-xs text-muted-foreground">
                +
              </span>
            )}

            <kbd
              className="
                inline-flex
                h-7
                min-w-7
                items-center
                justify-center
                rounded-md
                border
                border-border
                bg-muted
                px-2
                font-mono
                text-xs
                font-medium
                text-muted-foreground
                shadow-sm
              "
            >
              {displayKey}
            </kbd>
          </div>
        );
      })}
    </div>
  );
}

export function KeyboardShortcutsDialog() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent
    ) => {
      const isShortcut =
        (event.ctrlKey || event.metaKey) &&
        event.key === "/";

      if (!isShortcut) {
        return;
      }

      event.preventDefault();

      setOpen((current) => !current);
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );
    };
  }, []);

  return (
    <Dialog
      open={open}
      onOpenChange={setOpen}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            Keyboard shortcuts
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="mt-2 space-y-6">
            {shortcutGroups.map(
              (group) => (
                <section
                  key={group.title}
                >
                  <h3 className="mb-2 text-sm font-medium text-muted-foreground">
                    {group.title}
                  </h3>

                  <div className="overflow-hidden rounded-lg border">
                    {group.shortcuts.map(
                      (
                        shortcut,
                        index
                      ) => (
                        <div
                          key={`${group.title}-${shortcut.description}`}
                          className={[
                            "flex items-center justify-between gap-6 px-4 py-3",
                            index <
                            group
                              .shortcuts
                              .length -
                              1
                              ? "border-b"
                              : "",
                          ].join(" ")}
                        >
                          <span className="text-sm">
                            {
                              shortcut.description
                            }
                          </span>

                          <ShortcutKeys
                            keys={
                              shortcut.keys
                            }
                          />
                        </div>
                      )
                    )}
                  </div>
                </section>
              )
            )}
          </div>
        </ScrollArea>

        <div className="mt-2 flex items-center justify-between border-t pt-4">
          <span className="text-xs text-muted-foreground">
            Press the shortcut again to close
          </span>

          <kbd
            className="
              inline-flex
              h-7
              min-w-7
              items-center
              justify-center
              rounded-md
              border
              border-border
              bg-muted
              px-2
              font-mono
              text-xs
              font-medium
              text-muted-foreground
              shadow-sm
            "
          >
            Esc
          </kbd>
        </div>
      </DialogContent>
    </Dialog>
  );
}