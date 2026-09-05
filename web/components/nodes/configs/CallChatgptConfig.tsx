/* web/components/nodes/configs/CallChatgptConfig.tsx */
"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { InputOrTextareaWithVariablesSupport } from "@/app/(app-screens)/builder/components/InputAndTextareaWithVariablesSupport";

import type { NodeConfigComponentProps } from "./index";

export default function CallChatGPTConfig({
  config,
  onConfigChange,
}: NodeConfigComponentProps<"call_chatgpt">) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Prompt</Label>
        <InputOrTextareaWithVariablesSupport
          type="textarea"
          value={config.query ?? ""}
          onValueChange={(value) =>
            onConfigChange({
              ...config,
              query: value,
            })
          }
          placeholder="Summarize the page content..."
          rows={4}
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