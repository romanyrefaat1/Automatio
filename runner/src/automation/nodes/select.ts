import { Page } from "@playwright/test";

export default async function select(config: any, page: Page) {
  try {
    await page.locator(config.selector).selectOption(config.value);

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