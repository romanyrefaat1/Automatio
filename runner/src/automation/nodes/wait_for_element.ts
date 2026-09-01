import { Page } from "@playwright/test";

export default async function wait_for_element(config: any, page: Page) {
  try {
    await page.locator(config.selector).waitFor({
      state: config.state ?? "visible",
      timeout: config.timeout ?? 0,
    });

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