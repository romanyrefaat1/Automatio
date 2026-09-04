export type ValueConfig = {
  type:
    | "text"
    | "input_value"
    | "attribute"
    | "url"
    | "title"
    | "variable"
    | "static";

  selector?: string;
  attribute?: string;
  name?: string;
  value?: string;
};

import { Page } from "@playwright/test";

export default async function resolveValue(
  config: ValueConfig,
  page: Page,
  variables: Map<string, unknown>
): Promise<unknown> {
  switch (config.type) {
    case "static": {
      return config.value ?? "";
    }

    case "variable": {
      const name = String(config.name ?? "").trim();

      if (!name) {
        throw new Error(
          "Variable name cannot be empty"
        );
      }

      if (!variables.has(name)) {
        throw new Error(
          `Variable "${name}" was not found`
        );
      }

      return variables.get(name);
    }

    case "text": {
      if (!config.selector) {
        throw new Error(
          "Text comparison requires a selector"
        );
      }

      const text = await page
        .locator(config.selector)
        .textContent();

      return String(text ?? "").trim();
    }

    case "input_value": {
      if (!config.selector) {
        throw new Error(
          "Input value comparison requires a selector"
        );
      }

      return await page
        .locator(config.selector)
        .inputValue();
    }

    case "attribute": {
      if (!config.selector) {
        throw new Error(
          "Attribute comparison requires a selector"
        );
      }

      if (!config.attribute) {
        throw new Error(
          "Attribute comparison requires an attribute name"
        );
      }

      return await page
        .locator(config.selector)
        .getAttribute(config.attribute);
    }

    case "url": {
      return page.url();
    }

    case "title": {
      return page.title();
    }

    default:
      throw new Error(
        `Unknown comparison value type: ${config.type}`
      );
  }
}