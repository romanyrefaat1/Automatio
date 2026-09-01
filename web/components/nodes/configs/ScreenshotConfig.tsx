"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function ScreenshotConfig() {
  return (
    <div className="flex items-center gap-2">
      <Checkbox id="full-page" />

      <Label htmlFor="full-page">
        Full page
      </Label>
    </div>
  );
}