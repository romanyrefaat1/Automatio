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

type AutomationContextType = {
  automation: Automation | null;
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
  const [automation, setAutomation] =
    useState<Automation | null>(null);

  const [schedules, setSchedules] =
    useState<AutomationSchedule[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState<string | null>(null);

  /*
   * ----------------------------------------
   * Fetch automation
   * ----------------------------------------
   */

  const fetchAutomation = useCallback(async () => {
    setLoading(true);
    setError(null);

    const supabase = createClient();

    try {
      const [
        automationResult,
        schedulesResult,
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
      ]);

      if (automationResult.error) {
        throw automationResult.error;
      }

      if (schedulesResult.error) {
        throw schedulesResult.error;
      }

      setAutomation(automationResult.data);
      setSchedules(schedulesResult.data ?? []);
    } catch (err) {
      console.error(
        "Failed to fetch automation:",
        err
      );

      setAutomation(null);
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
    void fetchAutomation();
  }, [fetchAutomation]);

  return (
    <AutomationContext.Provider
      value={{
        automation,
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