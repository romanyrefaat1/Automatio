"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SelectConfig() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Selector</Label>
        <Input placeholder="select[name='country']" />
      </div>

      <div className="space-y-2">
        <Label>Value</Label>
        <Input placeholder="Egypt" />
      </div>
    </div>
  );
}