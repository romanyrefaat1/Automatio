"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ExtractTextConfig() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Selector</Label>
        <Input placeholder=".username" />
      </div>

      <div className="space-y-2">
        <Label>Save As</Label>
        <Input placeholder="username" />
      </div>
    </div>
  );
}