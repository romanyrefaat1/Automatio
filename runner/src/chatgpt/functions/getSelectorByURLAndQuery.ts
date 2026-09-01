import { chromium } from "@playwright/test";
import { jsonrepair } from "jsonrepair";
import { fetchPage } from "../fetch-page";
import { askChatGPT } from "../ask-chatgpt";

function extractJSON(text: string): any {
  if (!text || !text.trim()) {
    throw new Error("Empty text provided");
  }

  // 1. Strip markdown code blocks
  let cleaned = text
    .replace(/^```(?:json)?/gim, "")
    .replace(/```$/gim, "")
    .trim();

  // 2. Extract outermost JSON boundaries
  const firstBrace = cleaned.indexOf("{");
  const lastBrace = cleaned.lastIndexOf("}");

  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("No JSON object structure found in response");
  }

  cleaned = cleaned.substring(firstBrace, lastBrace + 1);

  // 3. Repair invalid syntax
  try {
    const repaired = jsonrepair(cleaned);
    return JSON.parse(repaired);
  } catch (err: any) {
    throw new Error(`Failed to parse repaired JSON: ${err.message}`);
  }
}

export async function index(url: string, message: string) {
  const browser = await chromium.launch({ headless: false });

  try {
    const cleanedDOM = await fetchPage(url, browser);

    // Prompt construction cleanly embeds stringified raw variables
    const prompt = `
You are an AI assistant for a web scraping automation engine. Your task is to analyze a user's natural language request alongside a cleaned HTML DOM, and determine the correct Playwright CSS/XPath selector OR ask clarifying questions if the request is ambiguous.

---

### INSTRUCTIONS:
1. **Analyze User Request & DOM:** Check if intent is clear and if the target element exists.
2. **Determine Action Type:**
   - **TALK:** Request is vague or missing context. Ask a concise clarifying question.
   - **QUERY:** Construct a valid, highly specific Playwright locator string for the element.

---

### RESPONSE FORMAT SCHEMA:
Respond ONLY with a single valid raw JSON object matching one of these structures:

If action is "TALK":
{"type": "TALK", "response": "Your clarifying question"}

If action is "QUERY":
{"type": "QUERY", "response": "your_css_or_xpath_selector"}

---

### INPUT DATA:

User Request: ${message}

Cleaned DOM:
${cleanedDOM}
`;

    const rawAnswer = await askChatGPT(prompt, browser);

    if (!rawAnswer || !rawAnswer.trim()) {
      throw new Error("Received empty response from ChatGPT");
    }

    const parsed = extractJSON(rawAnswer);

    if (parsed.type === "QUERY" && typeof parsed.response === "string") {
      console.log("Executing query:", parsed.response);
      return parsed;
    }

    if (parsed.type === "TALK" && typeof parsed.response === "string") {
      console.log("Asking user for clarification:", parsed.response);
      return parsed;
    }

    throw new Error(
      `Invalid JSON schema: expected 'QUERY' or 'TALK' type, got '${parsed?.type}'`
    );
  } catch (error: any) {
    console.error("Failed to parse ChatGPT output:", error.message);
  } finally {
    await browser.close();
  }
}