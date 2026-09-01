import { Page } from "@playwright/test";

export default async function condition(config: any, page: Page) {
  try {
    const text = await page.locator(config.selector).textContent();

    const actual = text?.trim() ?? "";
    const expected = String(config.value);

    let result = false;

    switch (config.operator) {
      case "is":
        result = actual === expected;
        break;

      case "is_not":
        result = actual !== expected;
        break;

      case "contains":
        result = actual.includes(expected);
        break;

      case "not_contains":
        result = !actual.includes(expected);
        break;

      case "starts_with":
        result = actual.startsWith(expected);
        break;

      case "ends_with":
        result = actual.endsWith(expected);
        break;

      default:
        throw new Error(
          `Unknown condition operator: ${config.operator}`
        );
    }

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