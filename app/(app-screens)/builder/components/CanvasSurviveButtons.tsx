"use client";

import {
  Redo2,
  Save,
  Undo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAutomationNodes } from "../contexts/AutomationNodesContext";

export default function CanvasSurviveButtons() {
  const {
    undo,
    redo,
    canUndo,
    canRedo,
    isDirty,
  } = useAutomationNodes();

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        onClick={undo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="size-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={redo}
        disabled={!canRedo}
        title="Redo (Ctrl+Shift+Z)"
      >
        <Redo2 className="size-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        disabled={!isDirty}
        title="Save (Ctrl+S)"
      >
        <Save className="size-4" />
      </Button>
    </div>
  );
}