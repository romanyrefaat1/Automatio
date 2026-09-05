import { Browser } from "@playwright/test";

export async function end(browser: Browser) {
  if (browser) {
    try {
      await browser.close();
    } catch (err) {
      console.warn("End node: browser already closed or failed to close:", err);
    }
  }
  return { success: true };
}