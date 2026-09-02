import { supabase } from "../supabase/supabase";


type AutomationStepRow = {
  id: string;
  automation_id: string;
  position: number;
  title: string;
  type: string;
  config: Record<string, unknown> | null;
};

type AutomationEdgeRow = {
  id?: string;
  automation_id?: string;

  // Depending on your automation_edges schema
  source?: string;
  target?: string;

  source_step_id?: string;
  target_step_id?: string;

  [key: string]: unknown;
};

export async function fetchWorkflow(automationId: string) {
  const { data: steps, error: stepsError } = await supabase
    .from("automation_steps")
    .select("*")
    .eq("automation_id", automationId)
    .order("position", { ascending: true });

  if (stepsError) {
    throw new Error(
      `Failed to fetch automation steps: ${stepsError.message}`
    );
  }

  const { data: edges, error: edgesError } = await supabase
    .from("automation_edges")
    .select("*")
    .eq("automation_id", automationId);

  if (edgesError) {
    throw new Error(
      `Failed to fetch automation edges: ${edgesError.message}`
    );
  }

  const workflowArray = (steps as AutomationStepRow[]).map((step) => ({
    id: step.id,
    type: step.type,
    position: step.position,

    data: {
      label: step.title,
      config: step.config ?? {},
    },
  }));

  const workflowEdges = (edges as AutomationEdgeRow[]).map((edge) => ({
    id: edge.id,

    source:
      edge.source ??
      edge.source_step_id,

    target:
      edge.target ??
      edge.target_step_id,
  }));

  return {
    workflowArray,
    workflowEdges,
  };
}