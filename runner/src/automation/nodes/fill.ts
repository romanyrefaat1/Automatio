import { Page } from "@playwright/test";

export default async function fill(config: any, page: Page) {
  try {
    const text = await page.locator(config.selector).fill(config.value, 
        {timeout: config.timeout ?? 0});

    return {
      success: true,
      data: text,
    };
  } catch (error) {
    return {
      success: false,
      error,
    };
  }
}