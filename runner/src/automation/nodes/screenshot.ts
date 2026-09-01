import { Page } from "@playwright/test";

export default async function screenshot(config: any, page: Page) {
  try {
    const screenshot = await page.screenshot({
      fullPage: config.fullPage ?? false,
    });

    return {
      success: true,
      data: screenshot,
    };
  } catch (error) {
    return {
      success: false,
      error,
    };
  }
}