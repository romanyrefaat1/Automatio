/* web/components/nodes/index.tsx */
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

import type { AutomationNode, AutomationNodeData, AutomationNodeType } from "@/types/nodes";

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
  defaultData?: Partial<AutomationNodeData>;
};

function previewProps(
  type: AutomationNodeType,
  label: string,
  description: string,
  config: Record<string, unknown> = {}
): NodeProps<AutomationNode> {
  return {
    id: `preview-${type}`,
    type,
    data: {
      label,
      description,
      config,
    },
    selected: false,
    zIndex: 0,
    isConnectable: false,
    positionAbsoluteX: 0,
    positionAbsoluteY: 0,
    dragging: false,
  } as unknown as NodeProps<AutomationNode>;
}

export const nodes: Record<AutomationNodeType, AutomationNodeConfig> = {
  trigger: {
    title: "Trigger",
    description: "Start automation",
    component: (
      <TriggerNode
        {...previewProps("trigger", "Trigger", "Start automation", {
          triggerType: "manual",
        })}
      />
    ),
  },

  goto: {
    title: "Go to URL",
    description: "Navigate browser",
    component: (
      <GotoNode
        {...previewProps("goto", "Go to URL", "Navigate browser", {
          url: "https://example.com",
          waitUntil: "load",
        })}
      />
    ),
  },

  click: {
    title: "Click",
    description: "Click an element",
    component: (
      <ClickNode
        {...previewProps("click", "Click", "Click an element", {
          selector: "#button",
          button: "left",
        })}
      />
    ),
  },

  fill: {
    title: "Fill",
    description: "Enter text",
    component: (
      <FillNode
        {...previewProps("fill", "Fill", "Enter text", {
          selector: "#email",
          value: "user@example.com",
        })}
      />
    ),
  },

  select: {
    title: "Select",
    description: "Select an option",
    component: (
      <SelectNode
        {...previewProps("select", "Select", "Select an option", {
          selector: "#country",
          value: "Egypt",
        })}
      />
    ),
  },

  check: {
    title: "Check",
    description: "Check checkbox",
    component: (
      <CheckNode
        {...previewProps("check", "Check", "Check checkbox", {
          selector: "#terms",
        })}
      />
    ),
  },

  uncheck: {
    title: "Uncheck",
    description: "Uncheck checkbox",
    component: (
      <UncheckNode
        {...previewProps("uncheck", "Uncheck", "Uncheck checkbox", {
          selector: "#newsletter",
        })}
      />
    ),
  },

  press: {
    title: "Press Key",
    description: "Press keyboard key",
    component: (
      <PressNode
        {...previewProps("press", "Press Key", "Press keyboard key", {
          key: "Enter",
          selector: "body",
        })}
      />
    ),
  },

  wait: {
    title: "Wait",
    description: "Pause execution",
    component: (
      <WaitNode
        {...previewProps("wait", "Wait", "Pause execution", {
          milliseconds: 1000,
        })}
      />
    ),
  },

  wait_for_element: {
    title: "Wait for Element",
    description: "Wait until element exists",
    component: (
      <WaitForElementNode
        {...previewProps("wait_for_element", "Wait for Element", "Wait until element exists", {
          selector: "#content",
          state: "visible",
          timeout: 5000,
        })}
      />
    ),
  },

  screenshot: {
    title: "Screenshot",
    description: "Capture page",
    component: (
      <ScreenshotNode
        {...previewProps("screenshot", "Screenshot", "Capture page", {
          fullPage: false,
        })}
      />
    ),
  },

  extract_text: {
    title: "Extract Text",
    description: "Read text from element",
    component: (
      <ExtractTextNode
        {...previewProps("extract_text", "Extract Text", "Read text from element", {
          selector: "h1",
          save_as: "pageTitle",
        })}
      />
    ),
  },

  assert_text: {
    title: "Assert Text",
    description: "Verify text content",
    component: (
      <AssertNode
        {...previewProps("assert_text", "Assert Text", "Verify text content", {
          selector: "h1",
          expected: "Welcome",
          match: "exact",
        })}
      />
    ),
  },

  assert_value: {
    title: "Assert Value",
    description: "Verify a value",
    component: (
      <AssertValueNode
        {...previewProps("assert_value", "Assert Value", "Verify a value", {
          selector: "input#search",
          expected: "query",
          match: "exact",
        })}
      />
    ),
  },

  condition: {
    title: "Condition",
    description: "Branch workflow",
    component: (
      <ConditionNode
        {...previewProps("condition", "Condition", "Branch workflow", {
          left: { type: "text", selector: "h1" },
          operator: "contains",
          right: { type: "static", value: "Dashboard" },
        })}
      />
    ),
  },

  loop: {
    title: "Loop",
    description: "Repeat workflow steps",
    component: (
      <LoopNode
        {...previewProps("loop", "Loop", "Repeat workflow steps", {
          max_iterations: 5,
          condition: {
            left: { type: "variable", name: "counter" },
            operator: "is",
            right: { type: "static", value: "5" },
          },
        })}
      />
    ),
  },

  parallel: {
    title: "Parallel",
    description: "Run branches concurrently",
    component: (
      <ParallelNode
        {...previewProps("parallel", "Parallel", "Run branches concurrently", {
          merge_variables: true,
        })}
      />
    ),
  },

  call_api: {
    title: "Call API",
    description: "Make an HTTP request",
    component: (
      <CallApiNode
        {...previewProps("call_api", "Call API", "Make an HTTP request", {
          method: "GET",
          url: "https://api.example.com/data",
        })}
      />
    ),
  },

  call_chatgpt: {
    title: "Call ChatGPT",
    description: "Run an AI request",
    component: (
      <CallChatGPTNode
        {...previewProps("call_chatgpt", "Call ChatGPT", "Run an AI request", {
          query: "Summarize this page content",
          save_as: "summary",
        })}
      />
    ),
  },

  telegram: {
    title: "Telegram",
    description: "Send Telegram message",
    component: (
      <TelegramNode
        {...previewProps("telegram", "Telegram", "Send Telegram message", {
          message: "Automation completed successfully.",
        })}
      />
    ),
  },

  end: {
    title: "End",
    description: "Finish automation",
    component: (
      <EndNode
        {...previewProps("end", "End", "Finish automation", {})}
      />
    ),
  },
};