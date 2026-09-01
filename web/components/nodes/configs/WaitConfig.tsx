"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function WaitConfig() {
  return (
    <div className="space-y-2">
      <Label>Duration (milliseconds)</Label>
      <Input type="number" placeholder="2000" min={0} />
    </div>
  );
}