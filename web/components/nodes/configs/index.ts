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
import AssertConfig from "./AssertTextConfig";
import ConditionConfig from "./ConditionConfig";
import EndConfig from "./EndConfig";

import type { NodeTypes } from "@/types/types";

export const nodeConfigComponents: Record<
  NodeTypes,
  ComponentType
> = {
  trigger: TriggerConfig,
  goto: GotoConfig,
  click: ClickConfig,
  fill: FillConfig,
  select: SelectConfig,
  check: CheckConfig,
  uncheck: UncheckConfig,
  press: PressConfig,
  wait: WaitConfig,
  waitForElement: WaitForElementConfig,
  screenshot: ScreenshotConfig,
  extractText: ExtractTextConfig,
  assert: AssertConfig,
  condition: ConditionConfig,
  end: EndConfig,
};