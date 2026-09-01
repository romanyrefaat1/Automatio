import { Page } from "@playwright/test";

export default async function condition(config: any, page: Page) {
  try {
    const text = await page.locator(config.selector).textContent();

    const actual = text?.trim() ?? "";

    let result = false;

    if (config.match === "exact") {
      result = actual === config.expected;
    } else {
      result = actual.includes(config.expected);
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