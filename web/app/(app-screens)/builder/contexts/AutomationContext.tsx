"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { Tables } from "@/types/supabase-auto";
import { createClient } from "@/lib/supabase/client";

type Automation = Tables<"automations">;
type AutomationSchedule = Tables<"automation_schedules">;
type AutomationStep = Tables<"automation_steps">;
type AutomationRun = Tables<"automation_runs">;
type AutomationRunStep = Tables<"automation_run_steps">;

type AutomationContextType = {
  automation: Automation | null;
  schedules: AutomationSchedule[];
  automationVariables: AutomationStep[];

  activeRun: AutomationRun | null;
  runSteps: AutomationRunStep[];
  runningStepId: string | null;
  isRunning: boolean;

  loading: boolean;
  error: string | null;

  refetch: () => Promise<void>;
};

const AutomationContext = createContext<
  AutomationContextType | undefined
>(undefined);

type AutomationProviderProps = {
  automationId: string;
  children: ReactNode;
};

export function AutomationProvider({
  automationId,
  children,
}: AutomationProviderProps) {
  const [automation, setAutomation] =
    useState<Automation | null>(null);

  const [schedules, setSchedules] =
    useState<AutomationSchedule[]>([]);

  const [automationVariables, setAutomationVariables] =
    useState<AutomationStep[]>([]);

  const [activeRun, setActiveRun] =
    useState<AutomationRun | null>(null);

  const [runSteps, setRunSteps] =
    useState<AutomationRunStep[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAutomation = useCallback(async () => {
    const supabase = createClient();

    setLoading(true);
    setError(null);

    try {
      const [
        automationResult,
        schedulesResult,
        automationVariablesResult,
        activeRunResult,
      ] = await Promise.all([
        supabase
          .from("automations")
          .select("*")
          .eq("id", automationId)
          .single(),

        supabase
          .from("automation_schedules")
          .select("*")
          .eq("automation_id", automationId)
          .order("created_at", {
            ascending: true,
          }),

        supabase
          .from("automation_steps")
          .select("*")
          .eq("automation_id", automationId)
          .not("config->>save_as", "is", null),

        supabase
          .from("automation_runs")
          .select("*")
          .eq("automation_id", automationId)
          .in("status", ["queued", "running"])
          .order("created_at", {
            ascending: false,
          })
          .limit(1)
          .maybeSingle(),
      ]);

      if (automationResult.error) {
        throw automationResult.error;
      }

      if (schedulesResult.error) {
        throw schedulesResult.error;
      }

      if (automationVariablesResult.error) {
        throw automationVariablesResult.error;
      }

      if (activeRunResult.error) {
        throw activeRunResult.error;
      }

      setAutomation(automationResult.data);
      setSchedules(schedulesResult.data ?? []);
      setAutomationVariables(
        automationVariablesResult.data ?? []
      );

      const run = activeRunResult.data ?? null;

      setActiveRun(run);

      if (run) {
        const { data, error: runStepsError } =
          await supabase
            .from("automation_run_steps")
            .select("*")
            .eq("run_id", run.id)
            .order("position", {
              ascending: true,
            });

        if (runStepsError) {
          throw runStepsError;
        }

        setRunSteps(data ?? []);
      } else {
        setRunSteps([]);
      }
    } catch (err) {
      console.error(
        "Failed to fetch automation:",
        err
      );

      setAutomation(null);
      setSchedules([]);
      setAutomationVariables([]);
      setActiveRun(null);
      setRunSteps([]);

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load automation"
      );
    } finally {
      setLoading(false);
    }
  }, [automationId]);

  useEffect(() => {
    void fetchAutomation();
  }, [fetchAutomation]);

  /*
   * Realtime: automation_runs
   *
   * This is responsible for discovering a new run and
   * keeping the current run status synchronized.
   */
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`automation-runs-${automationId}`)
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
            "AUTOMATION RUN EVENT:",
            payload.eventType,
            payload.new
          );

          if (
            payload.eventType === "INSERT" ||
            payload.eventType === "UPDATE"
          ) {
            const run = payload.new as AutomationRun;

            setActiveRun((current) => {
              /*
               * Always accept a new run.
               *
               * This is important because a new run may be
               * created while there is currently no activeRun
               * in React state.
               */
              if (payload.eventType === "INSERT") {
                return run;
              }

              /*
               * UPDATE:
               *
               * Update the currently displayed run if it is
               * the same run.
               */
              if (current?.id === run.id) {
                return run;
              }

              /*
               * Another run can appear while viewing an old
               * completed run. Prefer the newest active run.
               */
              if (
                run.status === "queued" ||
                run.status === "running"
              ) {
                return run;
              }

              return current;
            });

            /*
             * A run can finish without another step INSERT.
             * Keeping activeRun here is intentional so the
             * completed step remains available to the node UI.
             */
            return;
          }

          if (payload.eventType === "DELETE") {
            const deletedRun =
              payload.old as AutomationRun;

            setActiveRun((current) =>
              current?.id === deletedRun.id
                ? null
                : current
            );

            if (deletedRun.id === activeRun?.id) {
              setRunSteps([]);
            }
          }
        }
      )
      .subscribe((status, err) => {
        console.log(
          `Automation runs realtime [${automationId}]:`,
          status,
          err
        );
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [automationId, activeRun?.id]);

  /*
   * Realtime: automation_run_steps
   *
   * There is exactly ONE subscription for the current run.
   *
   * Whenever activeRun changes, the old subscription is
   * removed and a new one is created for the new run.
   */
  useEffect(() => {
    if (!activeRun?.id) {
      setRunSteps([]);
      return;
    }

    const runId = activeRun.id;
    const supabase = createClient();

    let cancelled = false;

    const loadRunSteps = async () => {
      const { data, error } = await supabase
        .from("automation_run_steps")
        .select("*")
        .eq("run_id", runId)
        .order("position", {
          ascending: true,
        });

      if (cancelled) {
        return;
      }

      if (error) {
        console.error(
          "Failed to fetch run steps:",
          error
        );
        return;
      }

      setRunSteps(data ?? []);
    };

    void loadRunSteps();

    const channel = supabase
      .channel(`automation-run-steps-${runId}`)
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
            "RUN STEP EVENT:",
            payload.eventType,
            payload.new
          );

          if (payload.eventType === "INSERT") {
            const step =
              payload.new as AutomationRunStep;

            setRunSteps((current) => {
              const alreadyExists = current.some(
                (existing) => existing.id === step.id
              );

              if (alreadyExists) {
                return current
                  .map((existing) =>
                    existing.id === step.id
                      ? step
                      : existing
                  )
                  .sort(
                    (a, b) => a.position - b.position
                  );
              }

              return [...current, step].sort(
                (a, b) => a.position - b.position
              );
            });

            return;
          }

          if (payload.eventType === "UPDATE") {
            const step =
              payload.new as AutomationRunStep;

            setRunSteps((current) => {
              const exists = current.some(
                (existing) => existing.id === step.id
              );

              if (!exists) {
                return [...current, step].sort(
                  (a, b) => a.position - b.position
                );
              }

              return current
                .map((existing) =>
                  existing.id === step.id
                    ? step
                    : existing
                )
                .sort(
                  (a, b) => a.position - b.position
                );
            });

            return;
          }

          if (payload.eventType === "DELETE") {
            const deletedStep =
              payload.old as AutomationRunStep;

            setRunSteps((current) =>
              current.filter(
                (existing) =>
                  existing.id !== deletedStep.id
              )
            );
          }
        }
      )
      .subscribe((status, err) => {
        console.log(
          `Run steps realtime [${runId}]:`,
          status,
          err
        );
      });

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [activeRun?.id]);

  /*
   * The currently executing automation step.
   */
  const runningStepId =
    runSteps.find(
      (step) => step.status === "running"
    )?.step_id ?? null;

  /*
   * Keep this true only while the run itself is active.
   * Completed/failed runs remain in activeRun so their
   * final step state can still be rendered.
   */
  const isRunning =
    activeRun?.status === "queued" ||
    activeRun?.status === "running";

  return (
    <AutomationContext.Provider
      value={{
        automation,
        schedules,
        automationVariables,

        activeRun,
        runSteps,
        runningStepId,
        isRunning,

        loading,
        error,

        refetch: fetchAutomation,
      }}
    >
      {children}
    </AutomationContext.Provider>
  );
}

export function useAutomationContext() {
  const context = useContext(
    AutomationContext
  );

  if (!context) {
    throw new Error(
      "useAutomationContext must be used inside an AutomationProvider"
    );
  }

  return context;
}