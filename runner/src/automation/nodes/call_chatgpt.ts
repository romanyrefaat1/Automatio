import { Browser } from "@playwright/test";
import { askChatGPT } from "../../chatgpt/ask-chatgpt";

export default async function call_chatgpt(
  config: any,
  browser: Browser
) {
  try {
    const response = await askChatGPT(config.query, browser);

    return {
      success: true,
      data: response,
      save_as: config.save_as,
    };
  } catch (error) {
    return {
      success: false,
      error,
    };
  }
}