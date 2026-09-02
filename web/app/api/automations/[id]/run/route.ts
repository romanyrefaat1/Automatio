import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const runnerUrl =
  "http://localhost:3000";

const runnerSecret = process.env.RUNNER_SECRET;
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!runnerSecret) {
  throw new Error("RUNNER_SECRET is not set");
}

if (!supabaseUrl) {
  throw new Error("SUPABASE_URL is not set");
}

if (!supabaseSecretKey) {
  throw new Error("SUPABASE_SECRET_KEY is not set");
}

const supabase = createClient(
  supabaseUrl,
  supabaseSecretKey,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export async function POST(
  _request: Request,
  context: {
    params: Promise<{ id: string }>;
  }
) {
  try {
    const { id: automationId } = await context.params;

    if (!automationId) {
      return NextResponse.json(
        {
          success: false,
          error: "Automation ID is required",
        },
        { status: 400 }
      );
    }

    // 1. Create the run in Supabase
    const { data: run, error: runError } = await supabase
      .from("automation_runs")
      .insert({
        automation_id: automationId,
        trigger: "manual",
        status: "queued",
      })
      .select("id")
      .single();

    if (runError) {
      console.error("Failed to create automation run:", runError);

      return NextResponse.json(
        {
          success: false,
          error: runError.message,
        },
        { status: 500 }
      );
    }

    // 2. Tell the runner to execute it
    const runnerResponse = await fetch(
      `${runnerUrl}/workflow`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${runnerSecret}`,
        },
        body: JSON.stringify({
          automationId,
          runId: run.id,
        }),
      }
    );

    const runnerData = await runnerResponse.json();

    if (!runnerResponse.ok) {
      // Mark the run as failed if runner rejected it
      await supabase
        .from("automation_runs")
        .update({
          status: "failed",
          finished_at: new Date().toISOString(),
          error:
            runnerData?.error ||
            `Runner returned ${runnerResponse.status}`,
        })
        .eq("id", run.id);

      return NextResponse.json(
        {
          success: false,
          error:
            runnerData?.error ||
            "Runner rejected the workflow",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      runId: run.id,
      automationId,
      runner: runnerData,
    });
  } catch (error) {
    console.error("Run automation error:", error);

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to run automation",
      },
      { status: 500 }
    );
  }
}