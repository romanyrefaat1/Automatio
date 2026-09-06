"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Copy,
  ExternalLink,
  File,
  Image as ImageIcon,
  Loader2,
  RefreshCw,
  Terminal,
  Timer,
  X,
  XCircle,
  Zap,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/client";

type RunStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled";

type RunTrigger = "manual" | "schedule";

type RunStepStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped";

type ArtifactType =
  | "screenshot"
  | "download"
  | "file";

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

type AutomationRunStep = {
  id: string;
  run_id: string;
  step_id: string | null;
  position: number;
  step_type: string;
  step_config: Record<string, unknown>;
  status: RunStepStatus;
  started_at: string | null;
  finished_at: string | null;
  error: string | null;
  result: unknown;
  created_at: string;
};

type AutomationArtifact = {
  id: string;
  run_id: string;
  run_step_id: string | null;
  type: ArtifactType;
  filename: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  storage_path: string;
  created_at: string;
};

type AutomationStep = {
  id: string;
  title: string;
  type: string;
  position: number;
};

const STEP_STATUS_LABEL: Record<
  RunStepStatus,
  string
> = {
  pending: "Pending",
  running: "Running",
  completed: "Completed",
  failed: "Failed",
  skipped: "Skipped",
};

function humanize(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDate(value: string | null) {
  if (!value) return "—";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatRelative(value: string | null) {
  if (!value) return "—";

  const date = new Date(value);
  const diff = Date.now() - date.getTime();

  if (diff < 0) {
    return formatDate(value);
  }

  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return "just now";

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

  return formatDate(value);
}

function formatDuration(
  startedAt: string | null,
  finishedAt: string | null,
  now = Date.now(),
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

function formatBytes(bytes: number | null) {
  if (bytes === null) return "Unknown size";

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getStepTitle(
  step: AutomationRunStep,
  automationSteps: AutomationStep[],
) {
  if (!step.step_id) {
    return humanize(step.step_type);
  }

  const source = automationSteps.find(
    (item) => item.id === step.step_id,
  );

  return source?.title ?? humanize(step.step_type);
}

function getStepIcon(type: string) {
  switch (type) {
    case "goto":
      return ExternalLink;
    case "click":
      return Zap;
    case "wait":
    case "wait_for_element":
      return Clock3;
    case "screenshot":
      return ImageIcon;
    case "extract_text":
      return Terminal;
    default:
      return ArrowUpRight;
  }
}

function RunStatusBadge({
  status,
}: {
  status: RunStatus;
}) {
  if (status === "running") {
    return (
      <Badge
        variant="outline"
        className="gap-1.5 border-info/30 bg-info-bg px-2.5 py-1 text-info-fg"
      >
        <span className="size-1.5 animate-pulse rounded-full bg-info-fg" />
        Running
      </Badge>
    );
  }

  if (status === "completed") {
    return (
      <Badge
        variant="outline"
        className="gap-1.5 border-success/30 bg-success-bg px-2.5 py-1 text-success-fg"
      >
        <span className="flex size-3.5 items-center justify-center rounded-full bg-success-fg">
          <Check
            className="size-2 text-success-foreground"
            strokeWidth={3}
          />
        </span>
        Completed
      </Badge>
    );
  }

  if (status === "failed") {
    return (
      <Badge
        variant="outline"
        className="gap-1.5 border-destructive/30 bg-destructive-bg px-2.5 py-1 text-destructive-fg"
      >
        <span className="flex size-3.5 items-center justify-center rounded-full bg-destructive-fg">
          <X
            className="size-2 text-destructive-foreground"
            strokeWidth={3}
          />
        </span>
        Failed
      </Badge>
    );
  }

  if (status === "queued") {
    return (
      <Badge
        variant="outline"
        className="gap-1.5 border-warning/30 bg-warning-bg px-2.5 py-1 text-warning-fg"
      >
        <span className="size-1.5 rounded-full bg-warning-fg" />
        Queued
      </Badge>
    );
  }

  return (
    <Badge
      variant="outline"
      className="gap-1.5 border-border bg-muted px-2.5 py-1 text-muted-foreground"
    >
      <span className="size-1.5 rounded-full bg-muted-foreground" />
      Cancelled
    </Badge>
  );
}

function StepStatusBadge({
  status,
}: {
  status: RunStepStatus;
}) {
  const label = STEP_STATUS_LABEL[status];

  if (status === "running") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-info-fg">
        <span className="size-1.5 animate-pulse rounded-full bg-info-fg" />
        {label}
      </span>
    );
  }

  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success-fg">
        <span className="flex size-3.5 items-center justify-center rounded-full bg-success-fg">
          <Check
            className="size-2 text-success-foreground"
            strokeWidth={3}
          />
        </span>
        {label}
      </span>
    );
  }

  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-destructive-fg">
        <span className="flex size-3.5 items-center justify-center rounded-full bg-destructive-fg">
          <X
            className="size-2 text-destructive-foreground"
            strokeWidth={3}
          />
        </span>
        {label}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
      <span className="size-1.5 rounded-full bg-muted-foreground/50" />
      {label}
    </span>
  );
}

function JsonBlock({
  value,
  emptyLabel = "No data recorded.",
}: {
  value: unknown;
  emptyLabel?: string;
}) {
  const hasValue =
    value !== null &&
    value !== undefined;

  if (!hasValue) {
    return (
      <div className="rounded-lg border bg-muted/20 px-3 py-4 text-center text-xs text-muted-foreground">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="group relative">
      <pre className="max-h-[360px] overflow-auto rounded-lg border bg-muted/30 p-3 font-mono text-[11px] leading-5 text-foreground">
        {JSON.stringify(value, null, 2)}
      </pre>

      <button
        type="button"
        className="absolute right-2 top-2 rounded-md border bg-background/90 p-1.5 text-muted-foreground opacity-0 shadow-sm transition-opacity hover:text-foreground group-hover:opacity-100"
        onClick={() => {
          void navigator.clipboard.writeText(
            JSON.stringify(value, null, 2),
          );
        }}
        title="Copy JSON"
      >
        <Copy className="size-3.5" />
      </button>
    </div>
  );
}

function InfoItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium text-muted-foreground">
        {label}
      </p>

      <div className="mt-1 text-sm font-medium">
        {children}
      </div>
    </div>
  );
}

export default function AutomationRunDetailPage() {
  const params = useParams<{
    id: string;
    runId: string;
  }>();

  const automationId = params.id;
  const runId = params.runId;

  const supabase = React.useMemo(
    () => createClient(),
    [],
  );

  const [automationName, setAutomationName] =
    React.useState("Automation");

  const [run, setRun] =
    React.useState<AutomationRun | null>(null);

  const [steps, setSteps] = React.useState<
    AutomationRunStep[]
  >([]);

  const [automationSteps, setAutomationSteps] =
    React.useState<AutomationStep[]>([]);

  const [artifacts, setArtifacts] = React.useState<
    AutomationArtifact[]
  >([]);

  const [loading, setLoading] = React.useState(true);

  const [refreshing, setRefreshing] =
    React.useState(false);

  const [error, setError] = React.useState<
    string | null
  >(null);

  const [expandedSteps, setExpandedSteps] =
    React.useState<Set<string>>(new Set());

  /*
   * This exists only so an active run's duration
   * keeps ticking visually.
   *
   * It does NOT fetch anything.
   */
  const [now, setNow] = React.useState(
    () => Date.now(),
  );

  const loadRun = React.useCallback(
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
          runResult,
          runStepsResult,
          automationStepsResult,
          artifactsResult,
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
            .eq("id", runId)
            .eq("automation_id", automationId)
            .single(),

          supabase
            .from("automation_run_steps")
            .select(
              "id, run_id, step_id, position, step_type, step_config, status, started_at, finished_at, error, result, created_at",
            )
            .eq("run_id", runId)
            .order("position", {
              ascending: true,
            }),

          supabase
            .from("automation_steps")
            .select(
              "id, title, type, position",
            )
            .eq("automation_id", automationId)
            .order("position", {
              ascending: true,
            }),

          supabase
            .from("automation_artifacts")
            .select(
              "id, run_id, run_step_id, type, filename, mime_type, size_bytes, storage_path, created_at",
            )
            .eq("run_id", runId)
            .order("created_at", {
              ascending: true,
            }),
        ]);

        if (automationResult.error) {
          throw automationResult.error;
        }

        if (runResult.error) {
          throw runResult.error;
        }

        if (runStepsResult.error) {
          throw runStepsResult.error;
        }

        if (automationStepsResult.error) {
          throw automationStepsResult.error;
        }

        if (artifactsResult.error) {
          throw artifactsResult.error;
        }

        setAutomationName(
          automationResult.data?.name ??
            "Automation",
        );

        setRun(
          runResult.data as AutomationRun,
        );

        setSteps(
          (runStepsResult.data ??
            []) as AutomationRunStep[],
        );

        setAutomationSteps(
          (automationStepsResult.data ??
            []) as AutomationStep[],
        );

        setArtifacts(
          (artifactsResult.data ??
            []) as AutomationArtifact[],
        );
      } catch (err) {
        console.error(
          "Failed to load run:",
          err,
        );

        setError(
          err instanceof Error
            ? err.message
            : "Failed to load run",
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [automationId, runId, supabase],
  );

  React.useEffect(() => {
    void loadRun();
  }, [loadRun]);

  /*
   * Realtime execution updates.
   *
   * One channel handles:
   * - automation_runs
   * - automation_run_steps
   * - automation_artifacts
   */
  React.useEffect(() => {
    const channelName =
      `automation-run-detail-${runId}`;

    const channel = supabase
      .channel(channelName)

      /*
       * Run status / metadata
       */
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "automation_runs",
          filter: `id=eq.${runId}`,
        },
        (payload) => {
          console.log(
            "[Realtime] automation_runs",
            payload.eventType,
            payload.new,
          );

          if (payload.eventType === "DELETE") {
            setRun(null);
            setSteps([]);
            setArtifacts([]);
            return;
          }

          setRun(
            payload.new as AutomationRun,
          );
        },
      )

      /*
       * Individual step execution updates.
       */
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "automation_run_steps",
          filter: `run_id=eq.${runId}`,
        },
        (payload) => {
          console.log(
            "[Realtime] automation_run_steps",
            payload.eventType,
            payload.new,
          );

          if (
            payload.eventType === "DELETE"
          ) {
            const deleted =
              payload.old as Partial<AutomationRunStep>;

            if (deleted.id) {
              setSteps((current) =>
                current.filter(
                  (step) =>
                    step.id !== deleted.id,
                ),
              );
            }

            return;
          }

          const nextStep =
            payload.new as AutomationRunStep;

          setSteps((current) => {
            if (payload.eventType === "INSERT") {
              const exists = current.some(
                (step) =>
                  step.id === nextStep.id,
              );

              if (exists) {
                return current;
              }

              return [
                ...current,
                nextStep,
              ].sort(
                (a, b) =>
                  a.position - b.position,
              );
            }

            return current
              .map((step) =>
                step.id === nextStep.id
                  ? nextStep
                  : step,
              )
              .sort(
                (a, b) =>
                  a.position - b.position,
              );
          });
        },
      )

      /*
       * Artifacts can appear while a run is executing.
       */
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "automation_artifacts",
          filter: `run_id=eq.${runId}`,
        },
        (payload) => {
          console.log(
            "[Realtime] automation_artifacts",
            payload.eventType,
            payload.new,
          );

          if (
            payload.eventType === "DELETE"
          ) {
            const deleted =
              payload.old as Partial<AutomationArtifact>;

            if (deleted.id) {
              setArtifacts((current) =>
                current.filter(
                  (artifact) =>
                    artifact.id !== deleted.id,
                ),
              );
            }

            return;
          }

          const nextArtifact =
            payload.new as AutomationArtifact;

          setArtifacts((current) => {
            if (
              payload.eventType === "INSERT"
            ) {
              const exists = current.some(
                (artifact) =>
                  artifact.id ===
                  nextArtifact.id,
              );

              if (exists) {
                return current;
              }

              return [
                ...current,
                nextArtifact,
              ].sort(
                (a, b) =>
                  new Date(
                    a.created_at,
                  ).getTime() -
                  new Date(
                    b.created_at,
                  ).getTime(),
              );
            }

            return current.map(
              (artifact) =>
                artifact.id ===
                nextArtifact.id
                  ? nextArtifact
                  : artifact,
            );
          });
        },
      )
      .subscribe((status, err) => {
        console.log(
          `[Realtime] run ${runId}:`,
          status,
          err,
        );
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [runId, supabase]);

  /*
   * Keep elapsed duration visually live without
   * making network requests.
   */
  React.useEffect(() => {
    if (
      !run ||
      (run.status !== "running" &&
        run.status !== "queued")
    ) {
      return;
    }

    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [run]);

  const toggleStep = (stepId: string) => {
    setExpandedSteps((current) => {
      const next = new Set(current);

      if (next.has(stepId)) {
        next.delete(stepId);
      } else {
        next.add(stepId);
      }

      return next;
    });
  };

  const completedSteps = steps.filter(
    (step) => step.status === "completed",
  ).length;

  const failedSteps = steps.filter(
    (step) => step.status === "failed",
  ).length;

  const artifactCount = artifacts.length;

  const totalDuration = formatDuration(
    run?.started_at ?? null,
    run?.finished_at ?? null,
    now,
  );

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <header className="shrink-0 border-b bg-background">
        <div className="mx-auto flex h-14 w-full max-w-[1480px] items-center gap-3 px-6">
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="size-8"
          >
            <Link
              href={`/builder/${automationId}/runs`}
            >
              <ArrowLeft className="size-4" />
              <span className="sr-only">
                Back to runs
              </span>
            </Link>
          </Button>

          <Separator
            orientation="vertical"
            className="h-5"
          />

          <Link
            href={`/builder/${automationId}`}
            className="max-w-[240px] truncate text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {automationName}
          </Link>

          <span className="text-muted-foreground/40">
            /
          </span>

          <Link
            href={`/builder/${automationId}/runs`}
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            Runs
          </Link>

          <span className="text-muted-foreground/40">
            /
          </span>

          <span className="font-mono text-xs text-muted-foreground">
            {runId}
          </span>

          <div className="ml-auto flex items-center gap-2">
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8"
            >
              <Link
                href={`/builder/${automationId}`}
              >
                Builder
              </Link>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-8 gap-2"
              onClick={() =>
                void loadRun(true)
              }
              disabled={refreshing}
            >
              <RefreshCw
                className={`size-3.5 ${
                  refreshing
                    ? "animate-spin"
                    : ""
                }`}
              />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[1160px] px-6 py-8">
          {loading ? (
            <div className="space-y-6">
              <div>
                <Skeleton className="h-7 w-48" />
                <Skeleton className="mt-2 h-4 w-72" />
              </div>

              <Card className="shadow-none">
                <div className="grid gap-6 p-5 sm:grid-cols-2 lg:grid-cols-4">
                  {Array.from({
                    length: 4,
                  }).map((_, index) => (
                    <div key={index}>
                      <Skeleton className="h-3 w-16" />
                      <Skeleton className="mt-2 h-5 w-28" />
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="shadow-none">
                <div className="p-5">
                  <Skeleton className="h-5 w-32" />

                  <div className="mt-5 space-y-3">
                    {Array.from({
                      length: 6,
                    }).map((_, index) => (
                      <Skeleton
                        key={index}
                        className="h-16 w-full"
                      />
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          ) : error || !run ? (
            <div className="flex min-h-[520px] items-center justify-center">
              <div className="max-w-md text-center">
                <div className="mx-auto flex size-11 items-center justify-center rounded-xl border bg-muted/40">
                  <XCircle className="size-5 text-muted-foreground" />
                </div>

                <h1 className="mt-4 text-lg font-semibold">
                  Run unavailable
                </h1>

                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {error ??
                    "This run could not be found."}
                </p>

                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="mt-5"
                >
                  <Link
                    href={`/builder/${automationId}/runs`}
                  >
                    Back to runs
                  </Link>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-7">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-2xl font-semibold tracking-tight">
                    Run #{run.attempt}
                  </h1>

                  <RunStatusBadge
                    status={run.status}
                  />
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  <span className="font-mono">
                    {run.id}
                  </span>

                  <span className="text-muted-foreground/40">
                    •
                  </span>

                  <span>
                    {formatRelative(
                      run.created_at,
                    )}
                  </span>
                </div>
              </div>

              <Card className="mb-6 shadow-none">
                <div className="grid divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
                  <div className="p-5">
                    <InfoItem label="Status">
                      <RunStatusBadge
                        status={run.status}
                      />
                    </InfoItem>
                  </div>

                  <div className="p-5">
                    <InfoItem label="Trigger">
                      <span className="inline-flex items-center gap-1.5">
                        {run.trigger ===
                        "manual" ? (
                          <Zap className="size-3.5 text-muted-foreground" />
                        ) : (
                          <Clock3 className="size-3.5 text-muted-foreground" />
                        )}

                        <span className="capitalize">
                          {run.trigger}
                        </span>
                      </span>
                    </InfoItem>
                  </div>

                  <div className="p-5">
                    <InfoItem label="Started">
                      <span>
                        {formatDate(
                          run.started_at,
                        )}
                      </span>
                    </InfoItem>
                  </div>

                  <div className="p-5">
                    <InfoItem label="Duration">
                      <span className="inline-flex items-center gap-1.5">
                        <Timer className="size-3.5 text-muted-foreground" />
                        {totalDuration}
                      </span>
                    </InfoItem>
                  </div>
                </div>

                <Separator />

                <div className="grid divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                  <div className="p-4">
                    <p className="text-[11px] text-muted-foreground">
                      Steps
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {completedSteps}{" "}
                      <span className="font-normal text-muted-foreground">
                        of {steps.length} completed
                      </span>
                    </p>
                  </div>

                  <div className="p-4">
                    <p className="text-[11px] text-muted-foreground">
                      Failed steps
                    </p>

                    <p
                      className={`mt-1 text-sm font-medium ${
                        failedSteps > 0
                          ? "text-destructive-fg"
                          : ""
                      }`}
                    >
                      {failedSteps}
                    </p>
                  </div>

                  <div className="p-4">
                    <p className="text-[11px] text-muted-foreground">
                      Artifacts
                    </p>

                    <p className="mt-1 text-sm font-medium">
                      {artifactCount}
                    </p>
                  </div>
                </div>
              </Card>

              {run.error ? (
                <Card className="mb-6 border-destructive/25 bg-destructive-bg shadow-none">
                  <div className="flex items-start gap-3 p-4">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-destructive/10">
                      <XCircle className="size-4 text-destructive-fg" />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-destructive-fg">
                        Run failed
                      </p>

                      <p className="mt-1 whitespace-pre-wrap break-words text-xs leading-5 text-destructive-fg/85">
                        {run.error}
                      </p>
                    </div>
                  </div>
                </Card>
              ) : null}

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
                <section>
                  <div className="mb-4 flex items-end justify-between">
                    <div>
                      <h2 className="text-base font-semibold">
                        Execution
                      </h2>

                      <p className="mt-1 text-xs text-muted-foreground">
                        Every step executed by the runner.
                      </p>
                    </div>

                    {run.status ===
                      "running" ||
                    run.status === "queued" ? (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Loader2 className="size-3.5 animate-spin" />
                        Updating live
                      </div>
                    ) : null}
                  </div>

                  {steps.length === 0 ? (
                    <Card className="shadow-none">
                      <div className="flex min-h-[300px] flex-col items-center justify-center px-6 text-center">
                        <div className="flex size-10 items-center justify-center rounded-lg border bg-muted/30">
                          <Activity className="size-4 text-muted-foreground" />
                        </div>

                        <p className="mt-4 text-sm font-medium">
                          No step executions
                        </p>

                        <p className="mt-1 max-w-sm text-xs leading-5 text-muted-foreground">
                          The runner has not recorded
                          individual step executions for this
                          run yet.
                        </p>
                      </div>
                    </Card>
                  ) : (
                    <div className="relative">
                      <div className="absolute bottom-6 left-[18px] top-6 w-px bg-border" />

                      <div className="space-y-3">
                        {steps.map(
                          (step, index) => {
                            const Icon =
                              getStepIcon(
                                step.step_type,
                              );

                            const stepArtifacts =
                              artifacts.filter(
                                (artifact) =>
                                  artifact.run_step_id ===
                                  step.id,
                              );

                            const expanded =
                              expandedSteps.has(
                                step.id,
                              );

                            return (
                              <Card
                                key={step.id}
                                className="relative overflow-hidden py-0 shadow-none"
                              >
                                <button
                                  type="button"
                                  onClick={() =>
                                    toggleStep(
                                      step.id,
                                    )
                                  }
                                  className="flex w-full items-center gap-3 p-4 text-left transition-colors hover:bg-muted/20"
                                >
                                  <div className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-lg border bg-background">
                                    <Icon className="size-4 text-muted-foreground" />
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-medium text-muted-foreground">
                                        {String(
                                          index + 1,
                                        ).padStart(
                                          2,
                                          "0",
                                        )}
                                      </span>

                                      <span className="truncate text-sm font-medium">
                                        {getStepTitle(
                                          step,
                                          automationSteps,
                                        )}
                                      </span>
                                    </div>

                                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                                      <span className="text-[10px] text-muted-foreground">
                                        {humanize(
                                          step.step_type,
                                        )}
                                      </span>

                                      <span className="text-muted-foreground/40">
                                        •
                                      </span>

                                      <span className="text-[10px] tabular-nums text-muted-foreground">
                                        {formatDuration(
                                          step.started_at,
                                          step.finished_at,
                                          now,
                                        )}
                                      </span>

                                      {step.error ? (
                                        <>
                                          <span className="text-muted-foreground/40">
                                            •
                                          </span>

                                          <span className="text-[10px] font-medium text-destructive-fg">
                                            Error
                                          </span>
                                        </>
                                      ) : null}
                                    </div>
                                  </div>

                                  <div className="flex shrink-0 items-center gap-3">
                                    <StepStatusBadge
                                      status={
                                        step.status
                                      }
                                    />

                                    {expanded ? (
                                      <ChevronDown className="size-4 text-muted-foreground" />
                                    ) : (
                                      <ChevronRight className="size-4 text-muted-foreground" />
                                    )}
                                  </div>
                                </button>

                                {expanded ? (
                                  <>
                                    <Separator />

                                    <div className="space-y-5 p-4 pl-16">
                                      <div className="grid gap-4 sm:grid-cols-2">
                                        <InfoItem label="Started">
                                          {formatDate(
                                            step.started_at,
                                          )}
                                        </InfoItem>

                                        <InfoItem label="Finished">
                                          {formatDate(
                                            step.finished_at,
                                          )}
                                        </InfoItem>
                                      </div>

                                      {step.error ? (
                                        <div>
                                          <p className="mb-2 text-xs font-semibold text-destructive-fg">
                                            Error
                                          </p>

                                          <div className="rounded-lg border border-destructive/20 bg-destructive-bg p-3">
                                            <p className="whitespace-pre-wrap break-words font-mono text-[11px] leading-5 text-destructive-fg/90">
                                              {step.error}
                                            </p>
                                          </div>
                                        </div>
                                      ) : null}

                                      <Tabs defaultValue="result">
                                        <TabsList className="h-8">
                                          <TabsTrigger
                                            value="result"
                                            className="h-7 px-2.5 text-[11px]"
                                          >
                                            Result
                                          </TabsTrigger>

                                          <TabsTrigger
                                            value="config"
                                            className="h-7 px-2.5 text-[11px]"
                                          >
                                            Config
                                          </TabsTrigger>
                                        </TabsList>

                                        <TabsContent
                                          value="result"
                                          className="mt-3"
                                        >
                                          <JsonBlock
                                            value={
                                              step.result
                                            }
                                            emptyLabel="This step did not return a result."
                                          />
                                        </TabsContent>

                                        <TabsContent
                                          value="config"
                                          className="mt-3"
                                        >
                                          <JsonBlock
                                            value={
                                              step.step_config
                                            }
                                          />
                                        </TabsContent>
                                      </Tabs>

                                      {stepArtifacts.length >
                                      0 ? (
                                        <div>
                                          <div className="mb-2 flex items-center justify-between">
                                            <p className="text-xs font-semibold">
                                              Artifacts
                                            </p>

                                            <span className="text-[10px] text-muted-foreground">
                                              {
                                                stepArtifacts.length
                                              }{" "}
                                              {stepArtifacts.length ===
                                              1
                                                ? "file"
                                                : "files"}
                                            </span>
                                          </div>

                                          <div className="space-y-2">
                                            {stepArtifacts.map(
                                              (
                                                artifact,
                                              ) => (
                                                <div
                                                  key={
                                                    artifact.id
                                                  }
                                                  className="flex items-center gap-3 rounded-lg border bg-muted/20 p-3"
                                                >
                                                  <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
                                                    {artifact.type ===
                                                    "screenshot" ? (
                                                      <ImageIcon className="size-4 text-muted-foreground" />
                                                    ) : (
                                                      <File className="size-4 text-muted-foreground" />
                                                    )}
                                                  </div>

                                                  <div className="min-w-0 flex-1">
                                                    <p className="truncate text-xs font-medium">
                                                      {artifact.filename ??
                                                        humanize(
                                                          artifact.type,
                                                        )}
                                                    </p>

                                                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                                                      {formatBytes(
                                                        artifact.size_bytes,
                                                      )}
                                                    </p>
                                                  </div>

                                                  <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 shrink-0 px-2 text-[10px]"
                                                    onClick={(
                                                      event,
                                                    ) => {
                                                      event.stopPropagation();
                                                    }}
                                                  >
                                                    <ExternalLink className="size-3" />
                                                  </Button>
                                                </div>
                                              ),
                                            )}
                                          </div>
                                        </div>
                                      ) : null}
                                    </div>
                                  </>
                                ) : null}
                              </Card>
                            );
                          },
                        )}
                      </div>
                    </div>
                  )}
                </section>

                <aside className="space-y-4">
                  <Card className="shadow-none">
                    <div className="p-4">
                      <h3 className="text-sm font-semibold">
                        Run details
                      </h3>

                      <div className="mt-4 space-y-4">
                        <InfoItem label="Run ID">
                          <span className="block truncate font-mono text-[11px] font-normal">
                            {run.id}
                          </span>
                        </InfoItem>

                        <InfoItem label="Attempt">
                          {run.attempt}
                        </InfoItem>

                        <InfoItem label="Created">
                          {formatDate(
                            run.created_at,
                          )}
                        </InfoItem>

                        <InfoItem label="Started">
                          {formatDate(
                            run.started_at,
                          )}
                        </InfoItem>

                        <InfoItem label="Finished">
                          {formatDate(
                            run.finished_at,
                          )}
                        </InfoItem>

                        {run.scheduled_for ? (
                          <InfoItem label="Scheduled for">
                            {formatDate(
                              run.scheduled_for,
                            )}
                          </InfoItem>
                        ) : null}

                        {run.schedule_id ? (
                          <InfoItem label="Schedule ID">
                            <span className="block truncate font-mono text-[10px] font-normal">
                              {run.schedule_id}
                            </span>
                          </InfoItem>
                        ) : null}
                      </div>
                    </div>
                  </Card>

                  <Card className="shadow-none">
                    <div className="p-4">
                      <h3 className="text-sm font-semibold">
                        Step summary
                      </h3>

                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Completed
                          </span>

                          <span className="text-xs font-medium">
                            {completedSteps}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Failed
                          </span>

                          <span className="text-xs font-medium">
                            {failedSteps}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            Total
                          </span>

                          <span className="text-xs font-medium">
                            {steps.length}
                          </span>
                        </div>
                      </div>

                      {steps.length > 0 ? (
                        <div className="mt-4 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-1.5 rounded-full bg-success transition-all duration-300"
                            style={{
                              width: `${
                                (completedSteps /
                                  steps.length) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      ) : null}
                    </div>
                  </Card>

                  {artifacts.length > 0 ? (
                    <Card className="shadow-none">
                      <div className="p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold">
                            Artifacts
                          </h3>

                          <span className="text-[10px] text-muted-foreground">
                            {artifacts.length}
                          </span>
                        </div>

                        <div className="mt-3 space-y-2">
                          {artifacts.map(
                            (artifact) => (
                              <div
                                key={
                                  artifact.id
                                }
                                className="flex items-center gap-2.5 rounded-md border p-2.5"
                              >
                                {artifact.type ===
                                "screenshot" ? (
                                  <ImageIcon className="size-3.5 text-muted-foreground" />
                                ) : (
                                  <File className="size-3.5 text-muted-foreground" />
                                )}

                                <div className="min-w-0 flex-1">
                                  <p className="truncate text-[10px] font-medium">
                                    {artifact.filename ??
                                      humanize(
                                        artifact.type,
                                      )}
                                  </p>

                                  <p className="mt-0.5 text-[9px] text-muted-foreground">
                                    {formatBytes(
                                      artifact.size_bytes,
                                    )}
                                  </p>
                                </div>
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    </Card>
                  ) : null}
                </aside>
              </div>

              <div className="mt-8 border-t pt-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium">
                      Need to change the automation?
                    </p>

                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Return to the builder to edit this workflow.
                    </p>
                  </div>

                  <Button
                    asChild
                    variant="outline"
                    size="sm"
                  >
                    <Link
                      href={`/builder/${automationId}`}
                    >
                      Open builder
                      <ArrowUpRight className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}