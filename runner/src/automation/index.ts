import { chromium } from "@playwright/test";
import loop from "./loop";

// Runner

export async function index(workflowArray) {
    const browser = await chromium.launch({ headless: false });

    const page = await browser.newPage()
    
    loop(workflowArray, browser, page)
}