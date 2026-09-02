import { chromium } from "@playwright/test";

import runner from "./runner";
import { supabase } from "../supabase/supabase";
import { fetchWorkflow } from "./fetch-workflow";

export async function automationIndex(
  automationId: string,
  runId: string
) {
  console.log(
    `Starting automation ${automationId}, run ${runId}`
  );

  const { workflowArray, workflowEdges } =
    await fetchWorkflow(automationId);

  console.log(
    `Fetched ${workflowArray.length} steps and ${workflowEdges.length} edges`
  );

  const { error: runningError } = await supabase
    .from("automation_runs")
    .update({
      status: "running",
      started_at: new Date().toISOString(),
      error: null,
    })
    .eq("id", runId);

  if (runningError) {
    console.error(
      "Failed to mark run as running:",
      runningError
    );
  }

  const browser = await chromium.launch({
    headless: false,
  });

  const page = await browser.newPage();

  try {
    await runner(
      workflowArray,
      workflowEdges,
      browser,
      page
    );

    const { error: completedError } = await supabase
      .from("automation_runs")
      .update({
        status: "completed",
        finished_at: new Date().toISOString(),
        error: null,
      })
      .eq("id", runId);

    if (completedError) {
      console.error(
        "Failed to mark run as completed:",
        completedError
      );
    }

    console.log(
      `Automation ${automationId} completed successfully`
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Workflow execution failed";

    console.error(
      `Automation ${automationId} failed:`,
      error
    );

    const { error: failedError } = await supabase
      .from("automation_runs")
      .update({
        status: "failed",
        finished_at: new Date().toISOString(),
        error: errorMessage,
      })
      .eq("id", runId);

    if (failedError) {
      console.error(
        "Failed to mark run as failed:",
        failedError
      );
    }

    throw error;
  } finally {
    await browser.close();
  }
}