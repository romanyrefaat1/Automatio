import { Page } from "@playwright/test";

export default async function goto(config: any, page: Page) {
  try {
    await page.goto(config.url, {
      waitUntil: config.waitUntil ?? "domcontentloaded",
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