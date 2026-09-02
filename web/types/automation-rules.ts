import { Database, Json } from "./supabase-auto";

/* =========================================================
   DATABASE ROW TYPES
   ========================================================= */

export type AutomationRow =
  Database["public"]["Tables"]["automations"]["Row"];

export type AutomationInsert =
  Database["public"]["Tables"]["automations"]["Insert"];

export type AutomationUpdate =
  Database["public"]["Tables"]["automations"]["Update"];

export type AutomationStepRow =
  Database["public"]["Tables"]["automation_steps"]["Row"];

export type AutomationStepInsert =
  Database["public"]["Tables"]["automation_steps"]["Insert"];

export type AutomationStepUpdate =
  Database["public"]["Tables"]["automation_steps"]["Update"];

export type AutomationScheduleRow =
  Database["public"]["Tables"]["automation_schedules"]["Row"];

export type AutomationScheduleInsert =
  Database["public"]["Tables"]["automation_schedules"]["Insert"];

export type AutomationScheduleUpdate =
  Database["public"]["Tables"]["automation_schedules"]["Update"];

export type AutomationRunRow =
  Database["public"]["Tables"]["automation_runs"]["Row"];

export type AutomationRunInsert =
  Database["public"]["Tables"]["automation_runs"]["Insert"];

export type AutomationRunUpdate =
  Database["public"]["Tables"]["automation_runs"]["Update"];

export type AutomationRunStepRow =
  Database["public"]["Tables"]["automation_run_steps"]["Row"];

export type AutomationRunStepInsert =
  Database["public"]["Tables"]["automation_run_steps"]["Insert"];

export type AutomationRunStepUpdate =
  Database["public"]["Tables"]["automation_run_steps"]["Update"];

export type AutomationArtifactRow =
  Database["public"]["Tables"]["automation_artifacts"]["Row"];

export type AutomationArtifactInsert =
  Database["public"]["Tables"]["automation_artifacts"]["Insert"];

export type AutomationArtifactUpdate =
  Database["public"]["Tables"]["automation_artifacts"]["Update"];


/* =========================================================
   DATABASE ENUM TYPES
   ========================================================= */

export type AutomationStatus =
  Database["public"]["Enums"]["automation_status"];

export type AutomationStepType =
  Database["public"]["Enums"]["automation_step_type"];

export type AutomationScheduleType =
  Database["public"]["Enums"]["automation_schedule_type"];

export type AutomationRunStatus =
  Database["public"]["Enums"]["automation_run_status"];

export type AutomationRunTrigger =
  Database["public"]["Enums"]["automation_run_trigger"];

export type AutomationRunStepStatus =
  Database["public"]["Enums"]["automation_run_step_status"];

export type AutomationArtifactType =
  Database["public"]["Enums"]["automation_artifact_type"];

export type AutomationTriggerType =
  Database["public"]["Enums"]["automation_trigger_type"];


/* =========================================================
   AUTOMATION STEP CONFIGS
   ========================================================= */

export type GotoConfig = {
  url: string;
  waitUntil?: "load" | "domcontentloaded" | "networkidle";
};

export type ClickConfig = {
  selector: string;
  timeout?: number;
  button?: "left" | "right" | "middle";
};

export type FillConfig = {
  selector: string;
  value: string;
  timeout?: number;
};

export type SelectConfig = {
  selector: string;
  value: string;
};

export type CheckConfig = {
  selector: string;
};

export type UncheckConfig = {
  selector: string;
};

export type PressConfig = {
  selector: string;
  key: string;
};

export type WaitConfig = {
  milliseconds: number;
};

export type WaitForElementConfig = {
  selector: string;
  state?: "attached" | "detached" | "visible" | "hidden";
  timeout?: number;
};

export type ScreenshotConfig = {
  fullPage?: boolean;
};

export type ConditionConfig =
  | {
      source: "url";
      operator: "equals" | "not_equals" | "contains" | "not_contains";
      value: string;
    }
  | {
      source: "text";
      operator: "equals" | "not_equals" | "contains" | "not_contains";
      value: string;
    }
  | {
      source: "variable";
      variable: string;
      operator: "equals" | "not_equals" | "contains" | "not_contains";
      value: string;
    }
  | {
      source: "element";
      selector: string;
      operator: "exists" | "not_exists";
    };

export type ExtractTextConfig = {
  selector: string;
  save_as: string;
};

export type AssertTextConfig = {
  selector: string;
  expected: string;
  match?: "exact" | "contains";
};


/* =========================================================
   STEP CONFIG MAP
   ========================================================= */

export type AutomationStepConfigMap = {
  goto: GotoConfig;
  click: ClickConfig;
  fill: FillConfig;
  select: SelectConfig;
  check: CheckConfig;
  uncheck: UncheckConfig;
  press: PressConfig;
  wait: WaitConfig;
  wait_for_element: WaitForElementConfig;
  screenshot: ScreenshotConfig;
  extract_text: ExtractTextConfig;
  assert_text: AssertTextConfig;
  condition: ConditionConfig;

  //
  loop: Json;
  parallel: Json;
  call_api: Json;
  call_chatgpt: Json;
  telegram: Json;
  trigger: Json;
  assert_value: Json;

  end: Record<string, never>;
};


/* =========================================================
   STRONGLY TYPED AUTOMATION STEP
   ========================================================= */

export type AutomationStepDefinition = {
  [T in AutomationStepType]: {
    type: T;
    config: AutomationStepConfigMap[T];
  };
}[AutomationStepType];


/* =========================================================
   COMPLETE APPLICATION STEP
   ========================================================= */

export type AutomationStep = AutomationStepDefinition & {
  id: string;
  automation_id: string;
  position: number;
  position_x: number;
  position_y: number;
  title: string;
  description: string | null;
};


/* =========================================================
   SCHEDULE DEFINITIONS
   ========================================================= */

export type OnceSchedule = {
  type: "once";
  run_at: string;
  interval_seconds?: never;
};

export type IntervalSchedule = {
  type: "interval";
  interval_seconds: number;
  run_at?: never;
};

export type AutomationScheduleDefinition =
  | OnceSchedule
  | IntervalSchedule;


/* =========================================================
   STEP RESULTS
   ========================================================= */

export type GotoResult = {
  finalUrl: string;
};

export type ClickResult = {
  clicked: true;
};

export type FillResult = {
  filled: true;
};

export type SelectResult = {
  selected: true;
};

export type CheckResult = {
  checked: true;
};

export type UncheckResult = {
  unchecked: true;
};

export type PressResult = {
  pressed: true;
};

export type WaitResult = {
  waitedMs: number;
};

export type WaitForElementResult = {
  found: boolean;
};

export type ScreenshotResult = {
  artifactId: string;
};

export type ExtractTextResult = {
  value: string;
};

export type AssertTextResult = {
  passed: true;
};

export type ConditionResult = {
  passed: boolean;
};

export type EndResult = {
  completed: true;
};


/* =========================================================
   STEP RESULT MAP
   ========================================================= */

export type AutomationStepResultMap = {
  goto: GotoResult;
  click: ClickResult;
  fill: FillResult;
  select: SelectResult;
  check: CheckResult;
  uncheck: UncheckResult;
  press: PressResult;
  wait: WaitResult;
  wait_for_element: WaitForElementResult;
  screenshot: ScreenshotResult;
  extract_text: ExtractTextResult;
  assert_text: AssertTextResult;
  condition: ConditionResult;

  /*
   * Result contracts for these need to be defined from
   * the runner implementation.
   */
  loop: Json;
  parallel: Json;
  call_api: Json;
  call_chatgpt: Json;
  telegram: Json;
  trigger: Json;
  assert_value: Json;

  end: EndResult;
};


/* =========================================================
   STRONGLY TYPED STEP RESULT
   ========================================================= */

export type AutomationStepResult = {
  [T in AutomationStepType]: {
    type: T;
    result: AutomationStepResultMap[T];
  };
}[AutomationStepType];


/* =========================================================
   APPLICATION-LEVEL RUN TYPES
   ========================================================= */

export type AutomationRun = {
  id: string;
  automationId: string;
  scheduleId: string | null;

  trigger: AutomationRunTrigger;
  status: AutomationRunStatus;

  scheduledFor: string | null;
  startedAt: string | null;
  finishedAt: string | null;

  error: string | null;
  attempt: number;

  createdAt: string;
};


/* =========================================================
   WORKER JOB
   ========================================================= */

export type AutomationJob = {
  runId: string;
  automationId: string;
  steps: AutomationStep[];
};


/* =========================================================
   EXECUTION RESULT
   ========================================================= */

export type StepExecutionSuccess<T = unknown> = {
  success: true;
  result: T;
};

export type StepExecutionFailure = {
  success: false;
  error: string;
};

export type StepExecutionResult<T = unknown> =
  | StepExecutionSuccess<T>
  | StepExecutionFailure;


/* =========================================================
   ARTIFACT
   ========================================================= */

export type AutomationArtifact = {
  id: string;
  runId: string;
  runStepId: string | null;

  type: AutomationArtifactType;

  storagePath: string;

  filename: string | null;
  mimeType: string | null;
  sizeBytes: number | null;

  createdAt: string;
};