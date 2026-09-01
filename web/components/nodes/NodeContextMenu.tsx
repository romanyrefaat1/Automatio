"use client";

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
} from "@/components/ui/context-menu";
import { Trash2 } from "lucide-react";

type NodeContextMenuProps = {
  nodeId: string | null;
  position: { x: number; y: number } | null;
  onClose: () => void;
  onDelete: (nodeId: string) => void;
};

export default function NodeContextMenu({
  nodeId,
  position,
  onClose,
  onDelete,
}: NodeContextMenuProps) {
  if (!nodeId || !position) {
    return null;
  }

  return (
    <ContextMenu
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <ContextMenuContent
        style={{
          position: "fixed",
          left: position.x,
          top: position.y,
        }}
      >
        <ContextMenuItem
          variant="destructive"
          onClick={() => {
            onDelete(nodeId);
            onClose();
          }}
        >
          <Trash2 className="size-4" />
          Delete node
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}