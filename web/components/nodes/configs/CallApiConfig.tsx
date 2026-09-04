"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type KeyValue = {
  key: string;
  value: string;
};

type Config = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  url?: string;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: string;
  save_as?: string;
};

type Props = {
  config: Config;
  onConfigChange: (config: Config) => void;
};

function objectToRows(
  object?: Record<string, string>
): KeyValue[] {
  if (!object || Object.keys(object).length === 0) {
    return [{ key: "", value: "" }];
  }

  return Object.entries(object).map(([key, value]) => ({
    key,
    value,
  }));
}

function rowsToObject(rows: KeyValue[]) {
  return rows.reduce<Record<string, string>>(
    (result, row) => {
      if (row.key.trim()) {
        result[row.key.trim()] = row.value;
      }

      return result;
    },
    {}
  );
}

export default function CallApiConfig({
  config,
  onConfigChange,
}: Props) {
  const [headers, setHeaders] = useState<KeyValue[]>(
    objectToRows(config.headers)
  );

  const [query, setQuery] = useState<KeyValue[]>(
    objectToRows(config.query)
  );

  const updateHeaders = (rows: KeyValue[]) => {
    setHeaders(rows);

    onConfigChange({
      ...config,
      headers: rowsToObject(rows),
    });
  };

  const updateQuery = (rows: KeyValue[]) => {
    setQuery(rows);

    onConfigChange({
      ...config,
      query: rowsToObject(rows),
    });
  };

  const updateRow = (
    rows: KeyValue[],
    index: number,
    field: keyof KeyValue,
    value: string,
    update: (rows: KeyValue[]) => void
  ) => {
    const next = [...rows];

    next[index] = {
      ...next[index],
      [field]: value,
    };

    update(next);
  };

  const addRow = (
    rows: KeyValue[],
    update: (rows: KeyValue[]) => void
  ) => {
    update([
      ...rows,
      {
        key: "",
        value: "",
      },
    ]);
  };

  const removeRow = (
    rows: KeyValue[],
    index: number,
    update: (rows: KeyValue[]) => void
  ) => {
    const next = rows.filter((_, i) => i !== index);

    update(
      next.length
        ? next
        : [{ key: "", value: "" }]
    );
  };

  const method = config.method ?? "GET";

  return (
    <div className="flex flex-col gap-5">
      <div className="space-y-2">
        <Label>Method</Label>

        <Select
          value={method}
          onValueChange={(
            value: "GET" | "POST" | "PUT" | "DELETE"
          ) =>
            onConfigChange({
              ...config,
              method: value,
            })
          }
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="GET">GET</SelectItem>
            <SelectItem value="POST">POST</SelectItem>
            <SelectItem value="PUT">PUT</SelectItem>
            <SelectItem value="DELETE">DELETE</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="api-url">
          API URL
        </Label>

        <Input
          id="api-url"
          placeholder="https://api.example.com/users"
          value={config.url ?? ""}
          onChange={(e) =>
            onConfigChange({
              ...config,
              url: e.target.value,
            })
          }
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Headers</Label>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              addRow(headers, updateHeaders)
            }
          >
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          {headers.map((row, index) => (
            <div
              key={index}
              className="flex gap-2"
            >
              <Input
                placeholder="Key"
                value={row.key}
                onChange={(e) =>
                  updateRow(
                    headers,
                    index,
                    "key",
                    e.target.value,
                    updateHeaders
                  )
                }
              />

              <Input
                placeholder="Value"
                value={row.value}
                onChange={(e) =>
                  updateRow(
                    headers,
                    index,
                    "value",
                    e.target.value,
                    updateHeaders
                  )
                }
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() =>
                  removeRow(
                    headers,
                    index,
                    updateHeaders
                  )
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Query Parameters</Label>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              addRow(query, updateQuery)
            }
          >
            <Plus className="mr-1 h-4 w-4" />
            Add
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          {query.map((row, index) => (
            <div
              key={index}
              className="flex gap-2"
            >
              <Input
                placeholder="Key"
                value={row.key}
                onChange={(e) =>
                  updateRow(
                    query,
                    index,
                    "key",
                    e.target.value,
                    updateQuery
                  )
                }
              />

              <Input
                placeholder="Value"
                value={row.value}
                onChange={(e) =>
                  updateRow(
                    query,
                    index,
                    "value",
                    e.target.value,
                    updateQuery
                  )
                }
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() =>
                  removeRow(
                    query,
                    index,
                    updateQuery
                  )
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>

      {(method === "POST" || method === "PUT") && (
        <div className="space-y-2">
          <Label htmlFor="api-body">
            Body
          </Label>

          <Input
            id="api-body"
            placeholder="Request body"
            value={config.body ?? ""}
            onChange={(e) =>
              onConfigChange({
                ...config,
                body: e.target.value,
              })
            }
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="api-save-as">
          Save Response As
        </Label>

        <Input
          id="api-save-as"
          placeholder="response"
          value={config.save_as ?? ""}
          onChange={(e) =>
            onConfigChange({
              ...config,
              save_as: e.target.value,
            })
          }
        />
      </div>
    </div>
  );
}