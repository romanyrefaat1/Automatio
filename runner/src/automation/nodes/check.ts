import { Page } from "@playwright/test";

export default async function check(config: any, page: Page) {
  try {
    await page.locator(config.selector).check();

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