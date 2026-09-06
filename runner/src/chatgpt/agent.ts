import { Browser, chromium } from "@playwright/test"

import { askChatGPT } from "./ask-chatgpt"
import { fetchPage } from "./fetch-page"

type AgentOptions = {
  maxRounds?: number
}

function extractPlaceholder(prompt: string): string | null {
  const match = prompt.match(/\{\$([^}]+)\}/)

  return match?.[1]?.trim() ?? null
}

function parseFetchPageCall(response: string): string | null {
  const match = response.match(/^FETCH_PAGE:\s*(.+)$/im)

  return match?.[1]?.trim() ?? null
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim()

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  return `https://${trimmed}`
}

export async function runChatGPTAgent(
  prompt: string,
  options: AgentOptions = {}
) {
  const maxRounds = options.maxRounds ?? 6
  const placeholderUrl = extractPlaceholder(prompt)

  let browser: Browser | undefined

  try {
    browser = await chromium.launch({
      headless: false,
    })

    let conversation = `
You are an autonomous web research agent.

The user's request may contain a website placeholder in this format:

{$example.com}

The value inside {$...} is the website/domain the user wants you to inspect.

You have one tool:

FETCH_PAGE: <url>

When you need the contents of a webpage, output ONLY:

FETCH_PAGE: <url>

Examples:

FETCH_PAGE: example.com
FETCH_PAGE: https://example.com/pricing

After receiving a FETCH_PAGE_RESULT, continue solving the original request.

You may use FETCH_PAGE multiple times.

Do not invent webpage contents.

Original user request:
${prompt}
`

    for (let round = 0; round < maxRounds; round++) {
      console.log(`Agent round ${round + 1}/${maxRounds}`)

      const response = await askChatGPT(
        conversation,
        browser
      )

      console.log("Agent response:", response)

      const requestedUrl = parseFetchPageCall(response)

      if (!requestedUrl) {
        return response
      }

      let url = requestedUrl

      if (
        url === "$url" ||
        url === "{$url}"
      ) {
        if (!placeholderUrl) {
          throw new Error(
            "The agent requested {$url}, but the prompt does not contain a {$...} placeholder."
          )
        }

        url = placeholderUrl
      }

      url = normalizeUrl(url)

      console.log(
        `Agent requested page: ${url}`
      )

      let pageContent: string

      try {
        pageContent = await fetchPage(
          url,
          browser
        )
      } catch (error) {
        pageContent = `FETCH_PAGE_ERROR: ${
          error instanceof Error
            ? error.message
            : "Unknown error"
        }`
      }

      conversation = `
You are continuing an autonomous web research task.

Original user request:
${prompt}

Previous agent response:
${response}

The agent requested:

FETCH_PAGE: ${url}

The page contents are:

FETCH_PAGE_RESULT
URL:
${url}

CONTENT:
${pageContent}

Continue the original task.

You may request another page using:

FETCH_PAGE: <url>

If you have enough information, provide the final answer directly.
Do not output FETCH_PAGE unless you actually need another webpage.
`
    }

    throw new Error(
      `Agent reached the maximum number of rounds (${maxRounds}) without producing a final answer.`
    )
  } finally {
    await browser?.close().catch(() => {})
  }
}