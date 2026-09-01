import { chromium } from "@playwright/test";
import runner from "./runner";

export async function index(
  workflowArray: any[],
  workflowEdges: any[]
) {
  const browser = await chromium.launch({
    headless: false,
  });

  const page = await browser.newPage();

  await runner(
    workflowArray,
    workflowEdges,
    browser,
    page
  );

  browser.close()
}