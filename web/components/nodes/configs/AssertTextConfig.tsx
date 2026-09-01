"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function AssertConfig() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Selector</Label>
        <Input placeholder="h1" />
      </div>

      <div className="space-y-2">
        <Label>Expected Text</Label>
        <Input placeholder="Welcome back" />
      </div>

      <div className="space-y-2">
        <Label>Match</Label>

        <Select defaultValue="contains">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="exact">Exact</SelectItem>
            <SelectItem value="contains">Contains</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}