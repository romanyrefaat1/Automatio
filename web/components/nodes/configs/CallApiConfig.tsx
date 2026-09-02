"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { NodeConfigComponentProps } from "./index";

/*
 * BEST GUESS — confirm field names against worker's
 * nodes/call_api.ts implementation (called with
 * (workflowNode.config) only, no page/browser).
 */

export default function CallApiConfig({
  config,
  onConfigChange,
}: NodeConfigComponentProps<"call_api">) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>URL</Label>
        <Input
          value={config.url ?? ""}
          onChange={(e) =>
            onConfigChange({
              ...config,
              url: e.target.value,
            })
          }
          placeholder="https://api.example.com/endpoint"
        />
      </div>

      <div className="space-y-2">
        <Label>Method</Label>

        <Select
          value={config.method ?? "GET"}
          onValueChange={(value) =>
            onConfigChange({
              ...config,
              method: value as
                | "GET"
                | "POST"
                | "PUT"
                | "PATCH"
                | "DELETE",
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="PATCH">PATCH</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Headers (JSON)</Label>
        <Textarea
          value={config.headers ?? ""}
          onChange={(e) =>
            onConfigChange({
              ...config,
              headers: e.target.value,
            })
          }
          placeholder='{"Authorization": "Bearer ..."}'
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label>Body (JSON)</Label>
        <Textarea
          value={config.body ?? ""}
          onChange={(e) =>
            onConfigChange({
              ...config,
              body: e.target.value,
            })
          }
          placeholder='{"key": "value"}'
          rows={3}
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
          placeholder="apiResponse"
        />
      </div>
    </div>
  );
}