import { Page } from "@playwright/test";
import compare from "./helper/compare";
import resolveValue, {
  type ValueConfig,
} from "./helper/resolveValue";

export type ConditionConfig = {
  left: ValueConfig;
  operator:
    | "is"
    | "is_not"
    | "contains"
    | "not_contains"
    | "starts_with"
    | "ends_with";
  right: ValueConfig;
};

export default async function condition(
  config: ConditionConfig,
  page: Page,
  variables: Map<string, unknown> = new Map()
) {
  try {
    if (!config.left) {
      throw new Error(
        "Condition left side is required"
      );
    }

    if (!config.right) {
      throw new Error(
        "Condition right side is required"
      );
    }

    const actual = await resolveValue(
      config.left,
      page,
      variables
    );

    const expected = await resolveValue(
      config.right,
      page,
      variables
    );

    const result = compare(
      actual,
      config.operator,
      expected
    );

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      error,
    };
  }
}