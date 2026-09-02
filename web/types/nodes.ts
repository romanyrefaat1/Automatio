import type { ComponentType } from "react";
import type { Node, NodeProps } from "@xyflow/react";

import {
  TriggerNode,
  GotoNode,
  ClickNode,
  FillNode,
  SelectNode,
  CheckNode,
  UncheckNode,
  PressNode,
  WaitNode,
  WaitForElementNode,
  ScreenshotNode,
  ExtractTextNode,
  AssertNode,
  ConditionNode,
  LoopNode,
  ParallelNode,
  CallApiNode,
  CallChatGPTNode,
  TelegramNode,
  AssertValueNode,
  EndNode,
} from "@/components/nodes";
import { Json } from "./supabase-auto";

export type AutomationNodeData = {
  label: string;
  description?: string;
  config?: Json;

  [key: string]: unknown;
};

export type AutomationNodeType =
  | "trigger"
  | "goto"
  | "click"
  | "fill"
  | "select"
  | "check"
  | "uncheck"
  | "press"
  | "wait"
  | "wait_for_element"
  | "screenshot"
  | "extract_text"
  | "assert_text"
  | "condition"
  | "loop"
  | "parallel"
  | "call_api"
  | "call_chatgpt"
  | "telegram"
  | "assert_value"
  | "end";

export type AutomationNode = Node<
  AutomationNodeData,
  AutomationNodeType
>;

export type AutomationNodeComponent =
  ComponentType<NodeProps<AutomationNode>>;

export type AutomationNodeConfig = {
  title: string;
  description: string;
  component: AutomationNodeComponent;
  defaultData: AutomationNodeData;
};

export type NodeTypes = Record<
  AutomationNodeType,
  AutomationNodeComponent
>;

export const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  goto: GotoNode,
  click: ClickNode,
  fill: FillNode,
  select: SelectNode,
  check: CheckNode,
  uncheck: UncheckNode,
  press: PressNode,
  wait: WaitNode,
  wait_for_element: WaitForElementNode,
  screenshot: ScreenshotNode,
  extract_text: ExtractTextNode,
  assert_text: AssertNode,
  condition: ConditionNode,
  loop: LoopNode,
  parallel: ParallelNode,
  call_api: CallApiNode,
  call_chatgpt: CallChatGPTNode,
  telegram: TelegramNode,
  assert_value: AssertValueNode,
  end: EndNode,
};