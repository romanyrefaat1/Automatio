"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import type { NodeConfigComponentProps } from "./index";

/*
 * BEST GUESS — confirm field names against worker's
 * nodes/call_chatgpt.ts implementation (called with
 * (workflowNode.config, browser)).
 */

export default function CallChatGPTConfig({
  config,
  onConfigChange,
}: NodeConfigComponentProps<"call_chatgpt">) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Prompt</Label>
        <Textarea
          value={config.prompt ?? ""}
          onChange={(e) =>
            onConfigChange({
              ...config,
              prompt: e.target.value,
            })
          }
          placeholder="Summarize the page content..."
          rows={4}
        />
      </div>

      <div className="space-y-2">
        <Label>Model</Label>
        <Input
          value={config.model ?? ""}
          onChange={(e) =>
            onConfigChange({
              ...config,
              model: e.target.value,
            })
          }
          placeholder="gpt-4o"
        />
      </div>

      <div className="space-y-2">
        <Label>Save Response As</Label>
        <Input
          value={config.save_as ?? ""}
          onChange={(e) =>
            onConfigChange({
              ...config,
              save_as: e.target.value,
            })
          }
          placeholder="summary"
        />
      </div>
    </div>
  );
}