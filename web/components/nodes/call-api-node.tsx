/* web/components/nodes/call-api-node.tsx */
"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import { Globe, ArrowDownRight, Database } from "lucide-react";

import type { AutomationNode } from "@/types/nodes";
import {
  NodeCard,
  NodeCodeField,
  NodeField,
  NodeHeader,
  NodeVariablePill,
  contentBase,
} from "./node-components";
import { Badge } from "@/components/ui/badge";

export function CallApiNode({
  data,
  selected,
}: NodeProps<AutomationNode>) {
  const config = (data.config && typeof data.config === "object" && !Array.isArray(data.config)
    ? data.config
    : {}) as {
      method?: "GET" | "POST" | "PUT" | "DELETE";
      url?: string;
      headers?: Record<string, string>;
      query?: Record<string, string>;
      body?: string;
      save_as?: string;
    };

  const method = (config.method || "GET").toUpperCase();
  const url = config.url || "";
  const queryCount = config.query ? Object.keys(config.query).length : 0;
  const headerCount = config.headers ? Object.keys(config.headers).length : 0;
  const hasBody = Boolean(config.body && config.body.trim().length > 0);
  const saveAs = config.save_as;

  const methodColors: Record<string, string> = {
    GET: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
    POST: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
    PUT: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
    DELETE: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
  };

  return (
    <NodeCard selected={selected}>
      <NodeHeader
        icon={<Globe className="h-4 w-4" />}
        title={data.label || "Call API"}
        description={data.description || "Send HTTP network request"}
        typeBadge="API"
        iconClass="bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30"
        badgeClass="border-sky-500/30 text-sky-600 dark:text-sky-400 bg-sky-500/10"
      />

      <div className={contentBase}>
        <div className="flex items-center gap-1.5">
          <Badge
            variant="outline"
            className={`font-mono text-[10px] font-bold px-2 py-0.5 ${methodColors[method] || ""}`}
          >
            {method}
          </Badge>
          <div className="min-w-0 flex-1 truncate font-mono text-xs text-foreground">
            {url || <span className="italic text-muted-foreground">https://api.example.com</span>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          {queryCount > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {queryCount} query {queryCount === 1 ? "param" : "params"}
            </Badge>
          )}

          {headerCount > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {headerCount} {headerCount === 1 ? "header" : "headers"}
            </Badge>
          )}

          {hasBody && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border">
              Payload Body
            </Badge>
          )}
        </div>

        {saveAs && (
          <NodeField label="Save Response As">
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