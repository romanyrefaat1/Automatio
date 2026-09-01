import { Page } from "@playwright/test";

export default async function assert_value(
  config: any,
  page: Page
) {
  try {
    const actual = await page
      .locator(config.selector)
      .inputValue();

    if (config.match === "exact") {
      if (actual !== config.expected) {
        throw new Error(
          `Expected "${config.expected}" but received "${actual}"`
        );
      }
    } else {
      if (!actual.includes(config.expected)) {
        throw new Error(
          `Expected "${actual}" to contain "${config.expected}"`
        );
      }
    }

    return {
      success: true,
    };
  } catch (error) {
    return {
      success: false,
      error,
    };
  }
}