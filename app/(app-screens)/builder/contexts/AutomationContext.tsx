"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { Database, Tables } from "@/types/database";
import { createClient } from "@/lib/supabase/client";

type Automation = Tables<"automations">;
type AutomationStep = Tables<"automation_steps">;
type AutomationSchedule = Tables<"automation_schedules">;

type AutomationContextType = {
  automation: Automation | null;
  steps: AutomationStep[];
  schedules: AutomationSchedule[];

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
  const [automation, setAutomation] = useState<Automation | null>(null);
  const [steps, setSteps] = useState<AutomationStep[]>([]);
  const [schedules, setSchedules] = useState<AutomationSchedule[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAutomation = useCallback(async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      const [
        automationResult,
        stepsResult,
        schedulesResult,
      ] = await Promise.all([
        supabase
          .from("automations")
          .select("*")
          .eq("id", automationId)
          .single(),

        supabase
          .from("automation_steps")
          .select("*")
          .eq("automation_id", automationId)
          .order("position", { ascending: true }),

        supabase
          .from("automation_schedules")
          .select("*")
          .eq("automation_id", automationId)
          .order("created_at", { ascending: true }),
      ]);

      if (automationResult.error) {
        throw automationResult.error;
      }

      if (stepsResult.error) {
        throw stepsResult.error;
      }

      if (schedulesResult.error) {
        throw schedulesResult.error;
      }

      setAutomation(automationResult.data);
      setSteps(stepsResult.data);
      setSchedules(schedulesResult.data);
    } catch (err) {
      console.error("Failed to fetch automation:", err);

      setAutomation(null);
      setSteps([]);
      setSchedules([]);

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
    fetchAutomation();
  }, [fetchAutomation]);

  return (
    <AutomationContext.Provider
      value={{
        automation,
        steps,
        schedules,
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
  const context = useContext(AutomationContext);

  if (!context) {
    throw new Error(
      "useAutomationContext must be used inside an AutomationProvider"
    );
  }

  return context;
}