"use client";

import type { ReactNode } from "react";
import type { NodeProps } from "@xyflow/react";

import { TriggerNode } from "./trigger-node";
import { GotoNode } from "./goto-node";
import { ClickNode } from "./click-node";
import { FillNode } from "./fill-node";
import { SelectNode } from "./select-node";
import { CheckNode } from "./check-node";
import { UncheckNode } from "./uncheck-node";
import { PressNode } from "./press-node";
import { WaitNode } from "./wait-node";
import { WaitForElementNode } from "./wait-for-element-node";
import { ScreenshotNode } from "./screenshot-node";
import { ExtractTextNode } from "./extract-text-node";
import { AssertNode } from "./assert-node";
import { AssertValueNode } from "./assert-value-node";
import { ConditionNode } from "./condition-node";
import { LoopNode } from "./loop-node";
import { ParallelNode } from "./parallel-node";
import { CallApiNode } from "./call-api-node";
import { CallChatGPTNode } from "./call-chatgpt-node";
import { TelegramNode } from "./telegram-node";
import { EndNode } from "./end-node";

import type { AutomationNodeType } from "@/types/nodes";

/* -------------------------------------------------------------------------- */
/* Component exports                                                          */
/* -------------------------------------------------------------------------- */

export { TriggerNode } from "./trigger-node";
export { GotoNode } from "./goto-node";
export { ClickNode } from "./click-node";
export { FillNode } from "./fill-node";
export { SelectNode } from "./select-node";
export { CheckNode } from "./check-node";
export { UncheckNode } from "./uncheck-node";
export { PressNode } from "./press-node";
export { WaitNode } from "./wait-node";
export { WaitForElementNode } from "./wait-for-element-node";
export { ScreenshotNode } from "./screenshot-node";
export { ExtractTextNode } from "./extract-text-node";
export { AssertNode as AssertTextNode } from "./assert-node";
export { AssertValueNode } from "./assert-value-node";
export { ConditionNode } from "./condition-node";
export { LoopNode } from "./loop-node";
export { ParallelNode } from "./parallel-node";
export { CallApiNode } from "./call-api-node";
export { CallChatGPTNode } from "./call-chatgpt-node";
export { TelegramNode } from "./telegram-node";
export { EndNode } from "./end-node";

/* -------------------------------------------------------------------------- */
/* Node config                                                                */
/* -------------------------------------------------------------------------- */

export type AutomationNodeConfig = {
  title: string;
  description: string;
  component: ReactNode;
};

export const nodes: Record<AutomationNodeType, AutomationNodeConfig> = {
  trigger: {
    title: "Trigger",
    description: "Start automation",
    component: (
      <TriggerNode
        data={{
          label: "Trigger",
        }}
      />
    ),
  },

  goto: {
    title: "Go to URL",
    description: "Navigate browser",
    component: (
      <GotoNode
        data={{
          url: "https://example.com",
        }}
      />
    ),
  },

  click: {
    title: "Click",
    description: "Click an element",
    component: (
      <ClickNode
        data={{
          selector: "#button",
        }}
      />
    ),
  },

  fill: {
    title: "Fill",
    description: "Enter text",
    component: (
      <FillNode
        data={{
          selector: "#email",
          value: "user@example.com",
        }}
      />
    ),
  },

  select: {
    title: "Select",
    description: "Select an option",
    component: (
      <SelectNode
        data={{
          selector: "#country",
          option: "Egypt",
        }}
      />
    ),
  },

  check: {
    title: "Check",
    description: "Check checkbox",
    component: (
      <CheckNode
        data={{
          selector: "#terms",
        }}
      />
    ),
  },

  uncheck: {
    title: "Uncheck",
    description: "Uncheck checkbox",
    component: (
      <UncheckNode
        data={{
          selector: "#newsletter",
        }}
      />
    ),
  },

  press: {
    title: "Press Key",
    description: "Press keyboard key",
    component: (
      <PressNode
        data={{
          key: "Enter",
        }}
      />
    ),
  },

  wait: {
    title: "Wait",
    description: "Pause execution",
    component: (
      <WaitNode
        data={{
          duration: 1000,
        }}
      />
    ),
  },

  wait_for_element: {
    title: "Wait for Element",
    description: "Wait until element exists",
    component: (
      <WaitForElementNode
        data={{
          selector: "#content",
          duration: 5000,
        }}
      />
    ),
  },

  screenshot: {
    title: "Screenshot",
    description: "Capture page",
    component: (
      <ScreenshotNode
        data={{
          value: "screenshot.png",
        }}
      />
    ),
  },

  extract_text: {
    title: "Extract Text",
    description: "Read text from element",
    component: (
      <ExtractTextNode
        data={{
          selector: "h1",
          variable: "pageTitle",
        }}
      />
    ),
  },

  assert_text: {
    title: "Assert Text",
    description: "Verify text content",
    component: (
      <AssertNode
        data={{
          selector: "h1",
          expected: "Welcome",
        }}
      />
    ),
  },

  assert_value: {
    title: "Assert Value",
    description: "Verify a value",
    component: (
      <AssertValueNode
        data={{
          label: "Assert Value",
        }}
      />
    ),
  },

  condition: {
    title: "Condition",
    description: "Branch workflow",
    component: (
      <ConditionNode
        data={{
          condition: "Element exists",
        }}
      />
    ),
  },

  loop: {
    title: "Loop",
    description: "Repeat workflow steps",
    component: (
      <LoopNode
        data={{
          label: "Loop",
        }}
      />
    ),
  },

  parallel: {
    title: "Parallel",
    description: "Run branches concurrently",
    component: (
      <ParallelNode
        data={{
          label: "Parallel",
        }}
      />
    ),
  },

  call_api: {
    title: "Call API",
    description: "Make an HTTP request",
    component: (
      <CallApiNode
        data={{
          label: "Call API",
        }}
      />
    ),
  },

  call_chatgpt: {
    title: "Call ChatGPT",
    description: "Run an AI request",
    component: (
      <CallChatGPTNode
        data={{
          label: "Call ChatGPT",
        }}
      />
    ),
  },

  telegram: {
    title: "Telegram",
    description: "Send Telegram message",
    component: (
      <TelegramNode
        data={{
          label: "Telegram",
        }}
      />
    ),
  },

  end: {
    title: "End",
    description: "Finish automation",
    component: (
      <EndNode
        data={{
          label: "End",
        }}
      />
    ),
  },
};