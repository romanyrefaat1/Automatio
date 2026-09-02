"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { NodeConfigComponentProps } from "./index";

/*
 * BEST GUESS — confirm field names against worker's
 * nodes/telegram.ts implementation (called with
 * (workflowNode.config) only).
 */

export default function TelegramConfig({
  config,
  onConfigChange,
}: NodeConfigComponentProps<"telegram">) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Chat ID</Label>
        <Input
          value={config.chat_id ?? ""}
          onChange={(e) =>
            onConfigChange({
              ...config,
              chat_id: e.target.value,
            })
          }
          placeholder="123456789"
        />
      </div>

      <div className="space-y-2">
        <Label>Message</Label>
        <Textarea
          value={config.message ?? ""}
          onChange={(e) =>
            onConfigChange({
              ...config,
              message: e.target.value,
            })
          }
          placeholder="Automation completed successfully."
          rows={3}
        />
      </div>
    </div>
  );
}