import { chromium } from "@playwright/test";

import runner from "./runner";

export async function automationIndex(
  workflowArray: any[],
  workflowEdges: any[]
) {
  const browser = await chromium.launch({
    headless: true,
  });

  const page = await browser.newPage();

  try {
    await runner(
      workflowArray,
      workflowEdges,
      browser,
      page
    );
  } finally {
    await browser.close();
  }
}