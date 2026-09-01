import { Page } from "@playwright/test";
import compare from "./helper/compare";

export default async function condition(
  config: any,
  page: Page
) {
  try {
    let actual: unknown;

    switch (config.source) {
      case "text": {
        actual = await page
          .locator(config.selector)
          .textContent();

        actual = String(actual ?? "").trim();

        break;
      }

      case "url": {
        actual = page.url();

        break;
      }

      case "title": {
        actual = await page.title();

        break;
      }

      case "input_value": {
        actual = await page
          .locator(config.selector)
          .inputValue();

        break;
      }

      case "attribute": {
        actual = await page
          .locator(config.selector)
          .getAttribute(config.attribute);

        break;
      }

      default:
        throw new Error(
          `Unknown condition source: ${config.source}`
        );
    }

    const result = compare(
      actual,
      config.operator,
      config.value
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