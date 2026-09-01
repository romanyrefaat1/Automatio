import { Page } from "@playwright/test";

export default async function uncheck(config: any, page: Page) {
  try {
    await page.locator(config.selector).uncheck();

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