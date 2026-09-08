import Link from "next/link";
import { Plus } from "lucide-react";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import type { AutomationWithLastRun } from "@/types/dashboard-ui";

import DashboardStats from "./(components)/DashboardStats";
import AutomationGrid from "./(components)/AutomationGrid";

export const instant = false;

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: automations, error: automationsError } = await supabase
    .from("automations")
    .select(
      "id, name, description, status, trigger_type, updated_at, created_at",
    )
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  if (automationsError) {
    console.error("Failed to load automations:", automationsError);
  }

  const automationIds = (automations ?? []).map(
    (automation) => automation.id,
  );

  let lastRunsByAutomation: Record<
    string,
    {
      status: string;
      finished_at: string | null;
      started_at: string | null;
      trigger: string;
    }
  > = {};

  let runsToday = 0;

  if (automationIds.length > 0) {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [{ data: runs, error: runsError }, { count, error: todayError }] =
      await Promise.all([
        supabase
          .from("automation_runs")
          .select(
            "automation_id, status, finished_at, started_at, trigger, created_at",
          )
          .in("automation_id", automationIds)
          .order("created_at", { ascending: false }),

        supabase
          .from("automation_runs")
          .select("id", {
            count: "exact",
            head: true,
          })
          .in("automation_id", automationIds)
          .gte("created_at", startOfToday.toISOString()),
      ]);

    if (runsError) {
      console.error("Failed to load automation runs:", runsError);
    }

    if (todayError) {
      console.error("Failed to count today's runs:", todayError);
    }

    runsToday = count ?? 0;

    for (const run of runs ?? []) {
      if (!lastRunsByAutomation[run.automation_id]) {
        lastRunsByAutomation[run.automation_id] = {
          status: run.status,
          finished_at: run.finished_at,
          started_at: run.started_at,
          trigger: run.trigger,
        };
      }
    }
  }

  const automationsWithRuns: AutomationWithLastRun[] = (
    automations ?? []
  ).map((automation) => ({
    ...automation,
    lastRun: lastRunsByAutomation[automation.id] ?? null,
  }));

  const activeCount = automationsWithRuns.filter(
    (automation) => automation.status === "active",
  ).length;

  return (
    <main className="min-h-full">
      <div className="mx-auto max-w-[1400px] px-6 py-8 lg:px-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1>Automations</h1>

            <p className="mt-1 text-muted-foreground">
              Build, run, and monitor your browser automations.
            </p>
          </div>

          <Button asChild>
            <Link href="/new-automation">
              <Plus className="mr-1.5 h-4 w-4" />
              New Automation
            </Link>
          </Button>
        </div>

        <DashboardStats
          total={automationsWithRuns.length}
          active={activeCount}
          runsToday={runsToday}
        />

        <div className="mt-10">
          <AutomationGrid automations={automationsWithRuns} />
        </div>
      </div>
    </main>
  );
}