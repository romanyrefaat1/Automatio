"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function PressConfig() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Selector</Label>
        <Input placeholder="input[name='search']" />
      </div>

      <div className="space-y-2">
        <Label>Key</Label>
        <Input placeholder="Enter" />
      </div>
    </div>
  );
}