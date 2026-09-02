import { index } from "./index";

const start = Date.now();

index(
  [
    {
      id: "api",
      type: "call_api",
      config: {
        method: "GET",
        url: "https://api.coingecko.com/api/v3/coins/bitcoin",
        save_as: "bitcoin",
      },
    },

    {
      id: "chatgpt",
      type: "call_chatgpt",
      config: {
        query: `
You are creating a useful daily Telegram briefing.

Here is the latest Bitcoin data retrieved from an API:

{{bitcoin}}

Analyze the data and create a concise briefing containing:

1. Bitcoin's current price.
2. Its 24-hour price change.
3. Its market capitalization.
4. One interesting observation from the data.
5. A simple explanation of what the numbers mean.

Only use information provided in the API response.
Do not make predictions or give financial advice.
Keep the message under 150 words.
Use clear formatting.
Do not mention that you are an AI.
`,
        save_as: "notification",
      },
    },

    {
      id: "telegram",
      type: "telegram",
      config: {
        bot_token: "YOUR_BOT_TOKEN",
        chat_id: "YOUR_CHAT_ID",
        message: "{{notification}}",
      },
    },
  ],
  [
    {
      source: "api",
      target: "chatgpt",
    },
    {
      source: "chatgpt",
      target: "telegram",
    },
  ]
).then(() => {
  const elapsed =
    (Date.now() - start) / 1000;

  console.log(
    `\nTOTAL TIME: ${elapsed.toFixed(2)} seconds`
  );
});