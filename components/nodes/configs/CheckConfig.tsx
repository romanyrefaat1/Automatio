"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function CheckConfig() {
  return (
    <div className="space-y-2">
      <Label>Selector</Label>
      <Input placeholder="input[type='checkbox']" />
    </div>
  );
}