/* web/components/nodes/telegram-node.tsx */
"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Send, Bot } from "lucide-react";

import type { AutomationNode } from "@/types/nodes";
import {
  NodeCard,
  NodeField,
  NodeHeader,
  NodeVariablePill,
  contentBase,
} from "./node-components";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@/contexts/user-context";

export function TelegramNode({
  data,
  selected,
}: NodeProps<AutomationNode>) {
  const config = (data.config && typeof data.config === "object" && !Array.isArray(data.config)
    ? data.config
    : {}) as {
      integration_id?: string;
      chat_id?: string;
      message?: string;
      save_as?: string;
    };

  const { integrations } = useUser();
  const matchedBot = integrations.find(
    (item) => item.id === config.integration_id && item.type === "telegram"
  );

  const botName = matchedBot?.name || (config.integration_id ? "Telegram Bot" : null);
  const message = config.message || "";
  const saveAs = config.save_as;

  return (
    <NodeCard selected={selected}>
      <NodeHeader
        icon={<Send className="h-4 w-4" />}
        title={data.label || "Telegram"}
        description={data.description || "Send message to Telegram chat"}
        typeBadge="TELEGRAM"
        iconClass="bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30"
        badgeClass="border-sky-500/30 text-sky-600 dark:text-sky-400 bg-sky-500/10"
      />

      <div className={contentBase}>
        <div className="space-y-1">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Bot Integration
          </div>
          <div>
            {botName ? (
              <Badge variant="secondary" className="flex items-center gap-1.5 text-xs w-fit">
                <Bot className="h-3.5 w-3.5 text-sky-500" />
                <span className="font-medium">{botName}</span>
              </Badge>
            ) : (
              <span className="italic text-xs text-muted-foreground">No bot selected</span>
            )}
          </div>
        </div>

        <NodeField label="Message Text">
          <div className="rounded-md border border-border/60 bg-muted/40 px-2.5 py-1.5 text-xs text-foreground line-clamp-3">
            {message || <span className="italic text-muted-foreground">Automation completed.</span>}
          </div>
        </NodeField>

        {saveAs && (
          <NodeField label="Save Result As">
            <div className="pt-0.5">
              <NodeVariablePill name={saveAs} />
            </div>
          </NodeField>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Top}
        id="input"
      />

      <Handle
        type="source"
        position={Position.Bottom}
        id="output"
      />
    </NodeCard>
  );
}