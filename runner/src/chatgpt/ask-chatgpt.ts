import { Browser, chromium } from "@playwright/test";

export async function askChatGPT(
  query: string,
  browserO?: Browser
) {
  let browser = browserO;
  let createdBrowserLocally = false;

  if (!browser) {
    browser = await chromium.launch({
      headless: false,
    });

    createdBrowserLocally = true;
  }

  const page = await browser.newPage();

  try {
    await page.goto("https://chatgpt.com/", {
      waitUntil: "domcontentloaded",
    });

    // Find the ChatGPT input
    const textarea = page
      .locator("#prompt-textarea, textarea")
      .first();

    await textarea.waitFor({
      state: "visible",
      timeout: 30000,
    });

    // Enter the prompt
    await textarea.fill(query);

    // Find the Send button
    const sendButton = page
      .locator(
        "button[data-testid='send-button'], button[aria-label='Send message']"
      )
      .first();

    await sendButton.waitFor({
      state: "visible",
      timeout: 30000,
    });

    await sendButton.click();

    // Find the latest assistant message
    const responseLocator = page
      .locator('[data-message-role="assistant"]')
      .last();

    await responseLocator.waitFor({
      state: "visible",
      timeout: 60000,
    });

    // ChatGPT streams its response.
    // Wait until the text stops changing.
    let previousText = "";
    let stableCount = 0;

    const startTime = Date.now();

    while (Date.now() - startTime < 60000) {
      const currentText = (
        await responseLocator.innerText()
      )
        .replace(/^ChatGPT said:\s*/i, "")
        .trim();

      if (
        currentText &&
        currentText !== "Writing"
      ) {
        if (currentText === previousText) {
          stableCount++;
        } else {
          stableCount = 0;
          previousText = currentText;
        }

        // The response has remained unchanged
        // for 3 consecutive checks.
        if (stableCount >= 3) {
          break;
        }
      }

      await page.waitForTimeout(1000);
    }

    // Get the final response
    const text = (
      await responseLocator.innerText()
    )
      .replace(/^ChatGPT said:\s*/i, "")
      .trim();

    if (!text) {
      throw new Error(
        "ChatGPT response was found but contained no generated text."
      );
    }

    return text;
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