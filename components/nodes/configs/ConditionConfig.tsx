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

export default function ConditionConfig() {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Source</Label>

        <Select defaultValue="url">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="url">Page URL</SelectItem>
            <SelectItem value="text">Page Text</SelectItem>
            <SelectItem value="variable">Variable</SelectItem>
            <SelectItem value="element">Element</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Value</Label>
        <Input placeholder="Enter value..." />
      </div>

      <div className="space-y-2">
        <Label>Operator</Label>

        <Select defaultValue="contains">
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>

          <SelectContent>
            <SelectItem value="equals">Equals</SelectItem>
            <SelectItem value="not_equals">Does not equal</SelectItem>
            <SelectItem value="contains">Contains</SelectItem>
            <SelectItem value="not_contains">
              Does not contain
            </SelectItem>
            <SelectItem value="exists">Exists</SelectItem>
            <SelectItem value="not_exists">Does not exist</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Expected Value</Label>
        <Input placeholder="Expected value..." />
      </div>
    </div>
  );
}