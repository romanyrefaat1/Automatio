export default async function telegram(config: any) {
  try {
    config.bot_token = process.env.telegram_bot_token
    config.chat_id = process.env.telegram_chatId
    if (!config.bot_token) {
      throw new Error(
        "Telegram bot token is required"
      );
    }

    if (!config.chat_id) {
      throw new Error(
        "Telegram chat ID is required"
      );
    }

    if (!config.message) {
      throw new Error(
        "Telegram message is required"
      );
    }

    const url = `https://api.telegram.org/bot${config.bot_token}/sendMessage`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: config.chat_id,
        text: config.message,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.ok) {
      return {
        success: false,
        status: response.status,
        status_text: response.statusText,
        data,
      };
    }

    return {
      success: true,
      status: response.status,
      data: data.result,
      save_as: config.save_as,
    };
  } catch (error) {
    return {
      success: false,
      error,
    };
  }
}