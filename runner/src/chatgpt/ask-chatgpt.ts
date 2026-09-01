import { Browser, chromium } from "@playwright/test";

export async function askChatGPT(query: string, browserO?: Browser) {
  let browser = browserO;
  let createdBrowserLocally = false;

  if (!browser) {
    browser = await chromium.launch({ headless: false });
    createdBrowserLocally = true;
  }

  const page = await browser.newPage();

  try {
    await page.goto("https://chatgpt.com/", { waitUntil: "domcontentloaded" });

    // Target prompt input reliably
    const textarea = page.locator("#prompt-textarea, textarea").first();
    await textarea.waitFor({ state: "visible" });
    await textarea.fill(query);
    
    // Submit prompt
    const sendButton = page.locator("button[data-testid='send-button'], button[aria-label='Send message']").first();
    await sendButton.click();

    // Wait until response generation finishes (Stop button disappears)
    await page.waitForSelector("button[aria-label='Stop streaming'], button[aria-label='Stop generating']", { state: "detached", timeout: 60000 }).catch(() => {});

    // Grab the entire assistant message content instead of just the first <p>
    const responseLocator = page.locator('[data-message-author-role="assistant"]').last();
    await responseLocator.waitFor({ state: "visible" });

    const text = await responseLocator.textContent();
    return text || "";
  } catch (error) {
    console.error("Error in askChatGPT:", error);
    throw error;
  } finally {
    await page.close();
    if (createdBrowserLocally && browser) {
      await browser.close();
    }
  }
}