export type AutomationStatus = "active" | "paused" | "draft" | "archived" | string;

export type TriggerType = "manual" | "schedule" | "webhook" | string;

export interface LastRunInfo {
  status: string;
  finished_at: string | null;
  started_at: string | null;
  trigger: string;
}

export interface AutomationWithLastRun {
  id: string;
  name: string;
  description: string | null;
  status: AutomationStatus;
  trigger_type: TriggerType;
  updated_at: string;
  created_at: string;
  lastRun: LastRunInfo | null;
}