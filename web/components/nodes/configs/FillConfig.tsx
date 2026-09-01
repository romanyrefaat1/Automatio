"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function FillConfig() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Selector</Label>
        <Input placeholder="input[name='email']" />
      </div>

      <div className="space-y-2">
        <Label>Value</Label>
        <Input placeholder="Enter value..." />
      </div>

      <div className="space-y-2">
        <Label>Timeout</Label>
        <Input type="number" placeholder="10000" min={0} />
      </div>
    </div>
  );
}