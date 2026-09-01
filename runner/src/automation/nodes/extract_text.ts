import { Page } from "@playwright/test";

export default async function extract_text(
  config: any,
  page: Page
) {
  try {
    const text = await page
      .locator(config.selector)
      .textContent();

    return {
      success: true,
      data: text?.trim() ?? "",
      save_as: config.save_as,
    };
  } catch (error) {
    return {
      success: false,
      error,
    };
  }
}