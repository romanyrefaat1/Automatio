import { Page } from "@playwright/test";

export default async function assert_text(config: any, page: Page) {
  try {
    const text = await page.locator(config.selector).textContent();

    const actual = text?.trim() ?? "";
    let isTrue = true;

    if (config.match === "exact") {
      if (actual !== config.expected) {
        isTrue = false;
      }
    } else {
      if (!actual.includes(config.expected)) {
        isTrue = false;
      }
    }

    return {
      success: true,
      data: isTrue,
      save_as: config.save_as,
    };
  } catch (error) {
    return {
      success: false,
      error,
    };
  }
}