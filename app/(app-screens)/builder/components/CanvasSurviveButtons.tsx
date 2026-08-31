"use client";

import {
  Loader2,
  Redo2,
  Save,
  Undo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { useAutomationNodes } from "../contexts/AutomationNodesContext";

export default function CanvasSurviveButtons() {
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    isDirty,
    isSaving,
    save,
  } = useAutomationNodes();

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={undo}
              disabled={!canUndo}
            >
              <Undo2 className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={redo}
              disabled={!canRedo}
            >
              <Redo2 className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Redo (Ctrl+Shift+Z)</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => void save()}
              disabled={!isDirty || isSaving}
            >
              {isSaving ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isSaving ? "Saving…" : "Save (Ctrl+S)"}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}