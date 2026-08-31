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
  EndNode,
} from "@/components/nodes";

export type AutomationNodeData = {
  label?: string;
  description?: string;

  url?: string;
  selector?: string;
  value?: string;
  option?: string;
  key?: string;

  duration?: number;

  variable?: string;
  expected?: string;

  condition?: string;

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
  | "extractText"
  | "assert"
  | "condition"
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
  waitForElement: WaitForElementNode,

  screenshot: ScreenshotNode,
  extractText: ExtractTextNode,
  assert: AssertNode,

  condition: ConditionNode,
  end: EndNode,
};