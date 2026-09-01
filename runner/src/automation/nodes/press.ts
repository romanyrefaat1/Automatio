import { Page } from "@playwright/test";

export default async function press(config: any, page: Page) {
  try {
    await page.locator(config.selector).press(config.key);

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