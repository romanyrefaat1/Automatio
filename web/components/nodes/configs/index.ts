"use client";

import type { ComponentType } from "react";

import TriggerConfig from "./TriggerConfig";
import GotoConfig from "./GotoConfig";
import ClickConfig from "./ClickConfig";
import FillConfig from "./FillConfig";
import SelectConfig from "./SelectConfig";
import CheckConfig from "./CheckConfig";
import UncheckConfig from "./UncheckConfig";
import PressConfig from "./PressConfig";
import WaitConfig from "./WaitConfig";
import WaitForElementConfig from "./WaitForElementConfig";
import ScreenshotConfig from "./ScreenshotConfig";
import ExtractTextConfig from "./ExtractTextConfig";
import AssertTextConfig from "./AssertTextConfig";
import ConditionConfig from "./ConditionConfig";
import EndConfig from "./EndConfig";
import LoopConfig from "./LoopConfig";
import ParallelConfig from "./ParallelConfig";
import CallApiConfig from "./CallApiConfig";
import TelegramConfig from "./TelegramConfig";
import AssertValueConfig from "./AssertValueConfig";

import type {
  AutomationNodeType,
  // AutomationStepConfigMap,
} from "@/types/nodes";

import {AutomationStepConfigMap} from "@/types/automation-rules"
import CallChatGPTConfig from "./CallChatgptConfig";

/*
 * NOTE: this file previously contained a copy-paste of the
 * "Add Nodes" catalog (components/nodes/index.ts) instead
 * of the actual config-form registry. There was no
 * `nodeConfigComponents` export at all, which is why
 * SubTabContent's import failed. This is the real content:
 * every node type's config-panel component, keyed exactly
 * to AutomationNodeType.
 */

/* =========================================================
   SHARED CONFIG COMPONENT CONTRACT
   =========================================================

   Every node's config panel is a controlled component:
   it receives the current config (typed to that specific
   node type via AutomationStepConfigMap) and reports
   changes back up. Partial<> because a config often starts
   empty ({}) before the user has filled every field in.
*/

export type NodeConfigComponentProps<
  T extends AutomationNodeType = AutomationNodeType
> = {
  config: Partial<AutomationStepConfigMap[T]>;
  onConfigChange: (
    config: Partial<AutomationStepConfigMap[T]>
  ) => void;
};

export const nodeConfigComponents: {
  [T in AutomationNodeType]: ComponentType<
    NodeConfigComponentProps<T>
  >;
} = {
  trigger: TriggerConfig,
  goto: GotoConfig,
  click: ClickConfig,
  fill: FillConfig,
  select: SelectConfig,
  check: CheckConfig,
  uncheck: UncheckConfig,
  press: PressConfig,
  wait: WaitConfig,
  wait_for_element: WaitForElementConfig,
  screenshot: ScreenshotConfig,
  extract_text: ExtractTextConfig,
  assert_text: AssertTextConfig,
  condition: ConditionConfig,
  loop: LoopConfig,
  parallel: ParallelConfig,
  call_api: CallApiConfig,
  call_chatgpt: CallChatGPTConfig,
  telegram: TelegramConfig,
  assert_value: AssertValueConfig,
  end: EndConfig,
};