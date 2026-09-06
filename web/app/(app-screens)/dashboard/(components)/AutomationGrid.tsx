"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import AutomationCard from "./AutomationCard";
import EmptyState from "./EmptyState";
import type { AutomationWithLastRun } from "../_types";

interface AutomationGridProps {
  automations: AutomationWithLastRun[];
}

export default function AutomationGrid({
  automations,
}: AutomationGridProps) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return automations.filter((automation) => {
      const matchesQuery =
        normalizedQuery === "" ||
        automation.name.toLowerCase().includes(normalizedQuery) ||
        (automation.description ?? "")
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesStatus =
        statusFilter === "all" ||
        automation.status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [automations, query, statusFilter]);

  if (automations.length === 0) {
    return <EmptyState />;
  }

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold">Your automations</h2>

            <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-muted px-2 text-xs font-medium text-muted-foreground">
              {automations.length}
            </span>
          </div>

          <p className="mt-1 text-sm text-muted-foreground">
            Manage and monitor your workflows.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <div className="relative w-full sm:w-64">
            <Search
              className="
                pointer-events-none absolute left-3 top-1/2
                h-4 w-4 -translate-y-1/2
                text-muted-foreground
              "
            />

            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search automations..."
              className="h-9 bg-card pl-9"
            />
          </div>

          <div className="relative">
            <SlidersHorizontal
              className="
                pointer-events-none absolute left-3 top-1/2 z-10
                h-3.5 w-3.5 -translate-y-1/2
                text-muted-foreground
              "
            />

            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="h-9 w-full bg-card pl-9 sm:w-36">
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>

          <h3 className="mt-4 text-base font-semibold">
            No automations found
          </h3>

          <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
            Try changing your search or status filter.
          </p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((automation) => (
            <AutomationCard
              key={automation.id}
              automation={automation}
            />
          ))}
        </div>
      )}
    </section>
  );
}