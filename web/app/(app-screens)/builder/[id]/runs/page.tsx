"use client";

import * as React from "react";
import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Check,
  Clock3,
  Loader2,
  RefreshCw,
  Search,
  X,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { createClient } from "@/lib/supabase/client";

type RunStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

type RunTrigger = "manual" | "schedule";

type AutomationRun = {
  id: string;
  automation_id: string;
  attempt: number;
  created_at: string;
  started_at: string | null;
  finished_at: string | null;
  scheduled_for: string | null;
  schedule_id: string | null;
  status: RunStatus;
  trigger: RunTrigger;
  error: string | null;
};

type PageProps = {
  params: Promise<{
    id: string;
  }>;
};

const STATUS_LABELS: Record<RunStatus, string> = {
  queued: "Queued",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  cancelled: "Cancelled",
};

function formatRelativeTime(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  const now = Date.now();
  const diff = now - date.getTime();

  if (diff < 0) {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }

  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) {
    return "just now";
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d ago`;
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year:
      date.getFullYear() !== new Date().getFullYear()
        ? "numeric"
        : undefined,
  }).format(date);
}

function formatExactDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatDuration(
  startedAt: string | null,
  finishedAt: string | null,
  now: number,
) {
  if (!startedAt) return "—";

  const start = new Date(startedAt).getTime();

  const end = finishedAt
    ? new Date(finishedAt).getTime()
    : now;

  const duration = Math.max(0, end - start);

  if (duration < 1000) {
    return `${duration}ms`;
  }

  if (duration < 60_000) {
    return `${(duration / 1000).toFixed(1)}s`;
  }

  const minutes = Math.floor(duration / 60_000);
  const seconds = Math.floor(
    (duration % 60_000) / 1000,
  );

  return `${minutes}m ${seconds}s`;
}

function StatusBadge({
  status,
}: {
  status: RunStatus;
}) {
  if (status === "running") {
    return (
      <Badge
        variant="outline"
        className="border-info/30 bg-info-bg px-2 py-0.5 font-medium text-info-fg"
      >
        <span className="mr-1.5 size-1.5 animate-pulse rounded-full bg-info-fg" />
        {STATUS_LABELS[status]}
      </Badge>
    );
  }

  if (status === "completed") {
    return (
      <Badge
        variant="outline"
        className="border-success/30 bg-success-bg px-2 py-0.5 font-medium text-success-fg"
      >
        <span className="mr-1.5 flex size-3 items-center justify-center rounded-full bg-success-fg text-success-foreground">
          <Check
            className="size-2"
            strokeWidth={3}
          />
        </span>
        {STATUS_LABELS[status]}
      </Badge>
    );
  }

  if (status === "failed") {
    return (
      <Badge
        variant="outline"
        className="border-destructive/30 bg-destructive-bg px-2 py-0.5 font-medium text-destructive-fg"
      >
        <span className="mr-1.5 flex size-3 items-center justify-center rounded-full bg-destructive-fg text-destructive-foreground">
          <X
            className="size-2"
            strokeWidth={3}
          />
        </span>
        {STATUS_LABELS[status]}
      </Badge>
    );
  }

  if (status === "queued") {
    return (
      <Badge
        variant="outline"
        className="border-warning/30 bg-warning-bg px-2 py-0.5 font-medium text-warning-fg"
      >
        <span className="mr-1.5 size-1.5 animate-pulse rounded-full bg-warning-fg" />
        {STATUS_LABELS[status]}
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="border-border bg-muted px-2 py-0.5 font-medium text-muted-foreground"
    >
      <span className="mr-1.5 size-1.5 rounded-full bg-muted-foreground" />
      {STATUS_LABELS[status]}
    </Badge>
  );
}

function Stat({
  label,
  value,
  subtle,
}: {
  label: string;
  value: number;
  subtle?: string;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium text-muted-foreground">
        {label}
      </p>

      <div className="mt-1 flex items-baseline gap-2">
        <p className="text-2xl font-semibold tracking-tight">
          {value}
        </p>

        {subtle ? (
          <span className="text-[11px] text-muted-foreground">
            {subtle}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function AutomationRunsContent({
  params,
}: PageProps) {
  const { id: automationId } = React.use(params);

  const supabase = React.useMemo(
    () => createClient(),
    [],
  );

  const [automationName, setAutomationName] =
    React.useState("Automation");

  const [runs, setRuns] = React.useState<AutomationRun[]>(
    [],
  );

  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] =
    React.useState(false);

  const [search, setSearch] = React.useState("");

  const [statusFilter, setStatusFilter] =
    React.useState<"all" | RunStatus>("all");

  const [error, setError] = React.useState<string | null>(
    null,
  );

  const [now, setNow] = React.useState(() =>
    Date.now(),
  );

  const loadRuns = React.useCallback(
    async (manualRefresh = false) => {
      if (manualRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError(null);

      try {
        const [
          automationResult,
          runsResult,
        ] = await Promise.all([
          supabase
            .from("automations")
            .select("id, name")
            .eq("id", automationId)
            .single(),

          supabase
            .from("automation_runs")
            .select(
              "id, automation_id, attempt, created_at, started_at, finished_at, scheduled_for, schedule_id, status, trigger, error",
            )
            .eq("automation_id", automationId)
            .order("created_at", {
              ascending: false,
            }),
        ]);

        if (automationResult.error) {
          throw automationResult.error;
        }

        if (runsResult.error) {
          throw runsResult.error;
        }

        setAutomationName(
          automationResult.data?.name ?? "Automation",
        );

        setRuns(
          (runsResult.data ?? []) as AutomationRun[],
        );
      } catch (err) {
        console.error(
          "Failed to load automation runs:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load automation runs",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [automationId, supabase],
  );

  React.useEffect(() => {
    void loadRuns();
  }, [loadRuns]);

  /*
   * Realtime source of truth for automation_runs.
   *
   * INSERT:
   *   Add a new run immediately.
   *
   * UPDATE:
   *   Replace the existing run immediately.
   *   This means queued -> running -> completed/failed
   *   is reflected without a refetch.
   *
   * DELETE:
   *   Remove the run immediately.
   */
  React.useEffect(() => {
    const channel = supabase
      .channel(`automation-runs-page-${automationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "automation_runs",
          filter: `automation_id=eq.${automationId}`,
        },
        (payload) => {
          console.log(
            "AUTOMATION RUN REALTIME:",
            payload.eventType,
            payload.new,
          );

          if (payload.eventType === "INSERT") {
            const newRun =
              payload.new as AutomationRun;

            setRuns((current) => {
              const exists = current.some(
                (run) => run.id === newRun.id,
              );

              if (exists) {
                return current
                  .map((run) =>
                    run.id === newRun.id
                      ? newRun
                      : run,
                  )
                  .sort(
                    (a, b) =>
                      new Date(
                        b.created_at,
                      ).getTime() -
                      new Date(
                        a.created_at,
                      ).getTime(),
                  );
              }

              return [newRun, ...current].sort(
                (a, b) =>
                  new Date(b.created_at).getTime() -
                  new Date(a.created_at).getTime(),
              );
            });

            return;
          }

          if (payload.eventType === "UPDATE") {
            const updatedRun =
              payload.new as AutomationRun;

            setRuns((current) => {
              const exists = current.some(
                (run) => run.id === updatedRun.id,
              );

              if (!exists) {
                return [updatedRun, ...current].sort(
                  (a, b) =>
                    new Date(
                      b.created_at,
                    ).getTime() -
                    new Date(
                      a.created_at,
                    ).getTime(),
                );
              }

              return current
                .map((run) =>
                  run.id === updatedRun.id
                    ? updatedRun
                    : run,
                )
                .sort(
                  (a, b) =>
                    new Date(
                      b.created_at,
                    ).getTime() -
                    new Date(
                      a.created_at,
                    ).getTime(),
                );
            });

            return;
          }

          if (payload.eventType === "DELETE") {
            const deletedRun =
              payload.old as Partial<AutomationRun>;

            setRuns((current) =>
              current.filter(
                (run) => run.id !== deletedRun.id,
              ),
            );
          }
        },
      )
      .subscribe((status, err) => {
        console.log(
          `Automation runs realtime [${automationId}]:`,
          status,
          err,
        );
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [automationId, supabase]);

  /*
   * Keep durations and relative timestamps live while
   * there is an active run.
   *
   * Realtime updates the data.
   * This interval only updates Date.now() so the UI can
   * display "12s", "13s", "14s", etc. without polling Supabase.
   */
  const hasActiveRuns = React.useMemo(
    () =>
      runs.some(
        (run) =>
          run.status === "running" ||
          run.status === "queued",
      ),
    [runs],
  );

  React.useEffect(() => {
    if (!hasActiveRuns) {
      return;
    }

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [hasActiveRuns]);

  const filteredRuns = React.useMemo(() => {
    const query = search.trim().toLowerCase();

    return runs.filter((run) => {
      const matchesStatus =
        statusFilter === "all" ||
        run.status === statusFilter;

      const matchesSearch =
        !query ||
        run.id.toLowerCase().includes(query) ||
        String(run.attempt).includes(query) ||
        run.trigger.toLowerCase().includes(query) ||
        run.status.toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [runs, search, statusFilter]);

  const stats = React.useMemo(
    () => ({
      total: runs.length,
      completed: runs.filter(
        (run) => run.status === "completed",
      ).length,
      failed: runs.filter(
        (run) => run.status === "failed",
      ).length,
      active: runs.filter(
        (run) =>
          run.status === "running" ||
          run.status === "queued",
      ).length,
    }),
    [runs],
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <header className="shrink-0 border-b">
        <div className="mx-auto flex h-14 w-full max-w-[1480px] items-center gap-3 px-6">
          <Link
            href={`/builder/${automationId}`}
            className="truncate text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {automationName}
          </Link>

          <span className="text-muted-foreground/50">
            /
          </span>

          <span className="text-sm font-medium">
            Runs
          </span>

          <div className="ml-auto flex items-center gap-2">
            <div className="hidden items-center gap-1.5 text-[11px] text-muted-foreground sm:flex">
              <span
                className={`size-1.5 rounded-full ${
                  hasActiveRuns
                    ? "animate-pulse bg-success-fg"
                    : "bg-muted-foreground/50"
                }`}
              />
              {hasActiveRuns
                ? "Live"
                : "Realtime connected"}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => void loadRuns(true)}
              disabled={refreshing}
              className="h-8 gap-2"
            >
              <RefreshCw
                className={`size-3.5 ${
                  refreshing ? "animate-spin" : ""
                }`}
              />
              Refresh
            </Button>

            <Button
              asChild
              size="sm"
              className="h-8"
            >
              <Link
                href={`/builder/${automationId}`}
              >
                Open builder
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1480px] px-6 py-8">
          <div className="mb-8">
            <div className="flex items-end justify-between gap-6">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  Runs
                </h1>

                <p className="mt-1 text-sm text-muted-foreground">
                  Execution history for{" "}
                  {automationName}.
                </p>
              </div>

              {!loading && runs.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {filteredRuns.length}{" "}
                  {filteredRuns.length === 1
                    ? "run"
                    : "runs"}
                </p>
              ) : null}
            </div>
          </div>

          {error ? (
            <Card className="mb-6 border-destructive/30 bg-destructive-bg shadow-none">
              <div className="flex items-start gap-3 p-4">
                <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md bg-destructive/10">
                  <X className="size-3.5 text-destructive-fg" />
                </div>

                <div>
                  <p className="text-sm font-medium text-destructive-fg">
                    Could not load runs
                  </p>

                  <p className="mt-1 text-xs text-destructive-fg/80">
                    {error}
                  </p>
                </div>
              </div>
            </Card>
          ) : null}

          <Card className="mb-6 shadow-none">
            <div className="grid grid-cols-2 divide-x lg:grid-cols-4">
              <div className="px-5 py-4">
                {loading ? (
                  <>
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="mt-2 h-7 w-10" />
                  </>
                ) : (
                  <Stat
                    label="Total runs"
                    value={stats.total}
                  />
                )}
              </div>

              <div className="px-5 py-4">
                {loading ? (
                  <>
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="mt-2 h-7 w-10" />
                  </>
                ) : (
                  <Stat
                    label="Completed"
                    value={stats.completed}
                  />
                )}
              </div>

              <div className="border-t px-5 py-4 lg:border-t-0">
                {loading ? (
                  <>
                    <Skeleton className="h-3 w-14" />
                    <Skeleton className="mt-2 h-7 w-10" />
                  </>
                ) : (
                  <Stat
                    label="Failed"
                    value={stats.failed}
                  />
                )}
              </div>

              <div className="border-l border-t px-5 py-4 lg:border-t-0">
                {loading ? (
                  <>
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="mt-2 h-7 w-10" />
                  </>
                ) : (
                  <Stat
                    label="Active"
                    value={stats.active}
                  />
                )}
              </div>
            </div>
          </Card>

          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search runs..."
                className="h-9 pl-9 text-xs"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto rounded-lg border bg-muted/30 p-1">
              {(
                [
                  ["all", "All"],
                  ["completed", "Completed"],
                  ["failed", "Failed"],
                  ["running", "Running"],
                  ["queued", "Queued"],
                  ["cancelled", "Cancelled"],
                ] as const
              ).map(([value, label]) => {
                const active =
                  statusFilter === value;

                const count =
                  value === "all"
                    ? runs.length
                    : runs.filter(
                        (run) =>
                          run.status === value,
                      ).length;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setStatusFilter(value)
                    }
                    className={`flex h-7 shrink-0 items-center gap-1.5 rounded-md px-2.5 text-xs font-medium transition-colors ${
                      active
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{label}</span>

                    <span
                      className={
                        active
                          ? "text-muted-foreground"
                          : "text-muted-foreground/70"
                      }
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <Card className="overflow-hidden py-0 shadow-none">
            <div className="hidden grid-cols-[minmax(260px,1.6fr)_150px_120px_150px_120px_110px] gap-4 border-b bg-muted/20 px-5 py-3 text-[11px] font-medium uppercase tracking-wide text-muted-foreground lg:grid">
              <span>Run</span>
              <span>Status</span>
              <span>Trigger</span>
              <span>Started</span>
              <span>Duration</span>
              <span />
            </div>

            {loading ? (
              <div>
                {Array.from({ length: 7 }).map(
                  (_, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-4 border-b px-5 py-4 last:border-b-0"
                    >
                      <div className="min-w-0 flex-1">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="mt-2 h-3 w-48" />
                      </div>

                      <Skeleton className="hidden h-5 w-20 sm:block" />
                      <Skeleton className="hidden h-4 w-16 md:block" />
                      <Skeleton className="hidden h-4 w-20 lg:block" />
                      <Skeleton className="hidden h-4 w-14 xl:block" />
                      <Skeleton className="h-8 w-20" />
                    </div>
                  ),
                )}
              </div>
            ) : filteredRuns.length === 0 ? (
              <div className="flex min-h-[360px] flex-col items-center justify-center px-6 text-center">
                <div className="flex size-10 items-center justify-center rounded-lg border bg-muted/40">
                  <Activity className="size-4 text-muted-foreground" />
                </div>

                <p className="mt-4 text-sm font-medium">
                  {runs.length === 0
                    ? "No runs yet"
                    : "No matching runs"}
                </p>

                <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
                  {runs.length === 0
                    ? "When this automation runs, its executions will appear here."
                    : "Try changing the status filter or search query."}
                </p>
              </div>
            ) : (
              <div>
                {filteredRuns.map((run) => (
                  <div
                    key={run.id}
                    className="group border-b last:border-b-0"
                  >
                    <div
                      className={`flex min-h-[76px] items-center gap-4 px-5 py-3.5 transition-colors ${
                        run.status === "running"
                          ? "bg-info-bg/20"
                          : "hover:bg-muted/20"
                      }`}
                    >
                      <div className="min-w-0 flex-1 lg:grid lg:grid-cols-[minmax(260px,1.6fr)_150px_120px_150px_120px_110px] lg:items-center lg:gap-4">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              Run #{run.attempt}
                            </span>

                            {run.attempt > 1 ? (
                              <span className="text-[10px] text-muted-foreground">
                                retry
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-1 flex items-center gap-2">
                            <span className="truncate font-mono text-[10px] text-muted-foreground">
                              {run.id}
                            </span>

                            <span className="text-muted-foreground/40">
                              •
                            </span>

                            <span
                              className="shrink-0 text-[10px] text-muted-foreground"
                              title={formatExactDate(
                                run.created_at,
                              )}
                            >
                              {formatRelativeTime(
                                run.created_at,
                              )}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 lg:mt-0">
                          <StatusBadge
                            status={run.status}
                          />
                        </div>

                        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground lg:mt-0">
                          {run.trigger === "manual" ? (
                            <Activity className="size-3.5" />
                          ) : (
                            <Clock3 className="size-3.5" />
                          )}

                          <span className="capitalize">
                            {run.trigger}
                          </span>
                        </div>

                        <div className="mt-2 text-xs text-muted-foreground lg:mt-0">
                          {run.started_at
                            ? formatRelativeTime(
                                run.started_at,
                              )
                            : "Not started"}
                        </div>

                        <div className="mt-2 text-xs tabular-nums text-muted-foreground lg:mt-0">
                          {formatDuration(
                            run.started_at,
                            run.finished_at,
                            now,
                          )}
                        </div>
                      </div>

                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="h-8 shrink-0 gap-1.5 px-2.5 text-xs opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100"
                      >
                        <Link
                          href={`/builder/${automationId}/runs/${run.id}`}
                        >
                          View run
                          <ArrowUpRight className="size-3.5" />
                        </Link>
                      </Button>
                    </div>

                    {run.error ? (
                      <div className="px-5 pb-3 pt-0">
                        <div className="rounded-md border border-destructive/20 bg-destructive-bg px-3 py-2">
                          <p className="truncate text-[11px] text-destructive-fg">
                            {run.error}
                          </p>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </main>

      {hasActiveRuns ? (
        <div className="pointer-events-none fixed bottom-5 left-1/2 z-20 -translate-x-1/2">
          <div className="flex items-center gap-2 rounded-full border bg-background/95 px-3 py-2 text-xs shadow-lg backdrop-blur">
            <Loader2 className="size-3.5 animate-spin text-info-fg" />

            <span className="font-medium">
              {stats.active === 1
                ? "1 run in progress"
                : `${stats.active} runs in progress`}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function AutomationRunsPage(
  props: PageProps,
) {
  return (
    <React.Suspense
      fallback={
        <div className="flex h-full min-h-0 flex-col bg-background">
          <header className="shrink-0 border-b">
            <div className="mx-auto flex h-14 w-full max-w-[1480px] items-center px-6">
              <Skeleton className="h-4 w-36" />
            </div>
          </header>

          <main className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto w-full max-w-[1480px] px-6 py-8">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="mt-2 h-4 w-72" />

              <Card className="mt-8 overflow-hidden shadow-none">
                <div className="p-5">
                  <Skeleton className="h-4 w-full max-w-2xl" />
                  <Skeleton className="mt-4 h-4 w-full" />
                  <Skeleton className="mt-4 h-4 w-5/6" />
                </div>
              </Card>
            </div>
          </main>
        </div>
      }
    >
      <AutomationRunsContent {...props} />
    </React.Suspense>
  );
}