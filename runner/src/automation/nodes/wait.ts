import { Page } from "@playwright/test";

export default async function wait(config: any, page: Page) {
  try {
    await page.waitForTimeout(config.milliseconds);

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