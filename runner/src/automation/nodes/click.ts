import { Page } from "@playwright/test";

export default async function click(config: any, page: Page) {
  try {
    await page.locator(config.selector).click({
      timeout: config.timeout ?? 0,
      button: config.button ?? "left"
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