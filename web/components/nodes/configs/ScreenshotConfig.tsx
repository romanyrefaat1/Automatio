"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

import type { NodeConfigComponentProps } from "./index";

export default function ScreenshotConfig({
  config,
  onConfigChange,
}: NodeConfigComponentProps<"screenshot">) {
  return (
    <div className="flex items-center gap-2">
      <Checkbox
        id="full-page"
        checked={config.fullPage ?? false}
        onCheckedChange={(checked) =>
          onConfigChange({
            ...config,
            fullPage: checked === true,
          })
        }
      />

      <Label htmlFor="full-page">Full page</Label>
    </div>
  );
}