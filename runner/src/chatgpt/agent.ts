import { chromium, type Browser } from "@playwright/test";
import { z } from "zod";
import { jsonrepair } from "jsonrepair";

import { askChatGPT } from "./ask-chatgpt";
import { fetchPage } from "./agent-tools/fetch-page/fetch-page";
import { callSystemFiles } from "./agent-tools/knowledge/callSystemFiles";

/*
 * ============================================================
 * 1. CONSTANTS
 * ============================================================
 */

const SYSTEM_OVERVIEW_PATH =
  "system/overview.md";

const MAX_IDENTICAL_TOOL_CALLS = 3;
const MAX_IDENTICAL_ROUND_SIGNATURES = 3;
const MAX_EMPTY_ROUNDS = 2;
const MAX_TOOL_HISTORY = 50;

/**
 * How much of a fetched page's content is kept in the
 * accumulated "already discovered" summary that gets
 * re-embedded into every subsequent prompt.
 *
 * The full content is what the model saw in the round it was
 * fetched (via the fresh tool result). After that, only a
 * bounded summary is carried forward so the prompt does not
 * grow without bound across rounds.
 */
const CARRIED_PAGE_CONTENT_CHARS = 4000;

/*
 * ============================================================
 * 2. SCHEMAS & TYPES
 * ============================================================
 */

/**
 * System file request schema.
 */
export const CallSystemFilesSchema = z.object({
  files: z
    .array(z.string())
    .min(1)
    .describe(
      "List of relative system file paths to inspect.",
    ),
});

/**
 * Fetch page request schema.
 */
export const FetchPageSchema = z.object({
  url: z
    .string()
    .url()
    .describe(
      "Target URL to retrieve inspection text from.",
    ),
});

/**
 * Text-based planning tool call.
 *
 * IMPORTANT:
 *
 * These are NOT workflow nodes.
 *
 * The only valid names are:
 * - call_system_files
 * - fetch_page
 */
export const ToolCallSchema = z.object({
  id: z.string(),
  name: z.string(),
  input: z.record(z.unknown()),
});

export type ToolCall = z.infer<
  typeof ToolCallSchema
>;

/**
 * Agent API response.
 */
export const AgentReplySchema = z.object({
  answer: z.string().default(""),

  toolCalls: z
    .array(ToolCallSchema)
    .default([]),

  result: z
    .record(z.unknown())
    .default({}),

  done: z.boolean().default(false),
});

export type AgentReply = z.infer<
  typeof AgentReplySchema
>;

export interface AgentConfig {
  maxRounds?: number;
  maxRetries?: number;
  headless?: boolean;
}

export interface ToolResult {
  id: string;
  name: string;
  output: string;
}

export type AgentToolName =
  | "fetch_page"
  | "call_system_files";

export type AgentToolCall = ToolCall;

export type AgentToolResult = ToolResult;

type FetchedPage = {
  url: string;
  content: string;
};

type ToolValidationResult = {
  validCalls: AgentToolCall[];
  errors: string[];
};

/**
 * A page successfully fetched at some point during the run.
 *
 * Kept keyed by normalized URL so later rounds can reference
 * it without re-fetching, and so the prompt builder can emit a
 * compact "already discovered" summary instead of replaying
 * the raw tool result every round.
 */
type DiscoveredPage = {
  url: string;
  content: string;
  fetchedAtRound: number;
};

type AgentContext = {
  userPrompt: string;

  result: Record<string, unknown>;

  toolResults: AgentToolResult[];

  /**
   * Successfully loaded non-overview system files, keyed by
   * path, holding their content so later rounds can reference
   * them without re-requesting them.
   */
  loadedSystemFiles: Set<string>;

  /**
   * Full content of loaded system files, keyed by path.
   *
   * Used to build a compact recap instead of re-sending the
   * full overview + full file contents every round.
   */
  loadedSystemFileContents: Map<string, string>;

  /**
   * Pages successfully fetched so far, keyed by normalized URL.
   *
   * Accumulated across the whole run (not overwritten each
   * round) so the model never loses earlier discoveries, and
   * so the runner can deterministically block re-fetching a
   * URL that already succeeded.
   */
  discoveredPages: Map<string, DiscoveredPage>;

  /**
   * Authoritative system overview.
   *
   * Loaded once before the first model request. Sent in full
   * only on the initial prompt; later rounds get a short
   * pointer instead of the full text.
   */
  systemOverview: string;

  /**
   * Anti-loop state.
   */
  recentRoundSignatures: string[];

  repeatedToolCalls: Map<string, number>;

  toolCallHistory: Array<{
    fingerprint: string;
    outputFingerprint: string;
  }>;

  /**
   * Prevent endless done:false + no-tool-call rounds.
   */
  emptyRounds: number;

  /**
   * Current round number (1-indexed), tracked for logging and
   * for annotating discoveredPages.
   */
  currentRound: number;
};

/*
 * ============================================================
 * 3. LOGGING
 * ============================================================
 */

const AGENT_LOG_PREFIX =
  "[Automatio Agent]";

function log(
  message: string,
  data?: unknown,
): void {
  const timestamp =
    new Date().toISOString();

  if (data === undefined) {
    console.log(
      `${AGENT_LOG_PREFIX} [${timestamp}] ${message}`,
    );
    return;
  }

  console.log(
    `${AGENT_LOG_PREFIX} [${timestamp}] ${message}`,
    data,
  );
}

function logError(
  message: string,
  error?: unknown,
): void {
  const timestamp =
    new Date().toISOString();

  if (error === undefined) {
    console.error(
      `${AGENT_LOG_PREFIX} [${timestamp}] ERROR ${message}`,
    );
    return;
  }

  console.error(
    `${AGENT_LOG_PREFIX} [${timestamp}] ERROR ${message}`,
    error,
  );
}

function logWarn(
  message: string,
  data?: unknown,
): void {
  const timestamp =
    new Date().toISOString();

  if (data === undefined) {
    console.warn(
      `${AGENT_LOG_PREFIX} [${timestamp}] WARN ${message}`,
    );
    return;
  }

  console.warn(
    `${AGENT_LOG_PREFIX} [${timestamp}] WARN ${message}`,
    data,
  );
}

function stringifySafe(
  value: unknown,
): string {
  try {
    return JSON.stringify(
      value,
      null,
      2,
    );
  } catch {
    return String(value);
  }
}

function summarizeText(
  text: string,
  maxLength = 1000,
): string {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(
    0,
    maxLength,
  )}... [truncated, total ${text.length} chars]`;
}

/*
 * ============================================================
 * 4. ANTI-PLUGIN / UI LEAK DETECTION
 * ============================================================
 */

const PLUGIN_UI_LEAK_PATTERNS = [
  /searching (for )?.*plugins?/i,
  /connect your other apps/i,
  /browser (automation )?connector/i,
  /log in to connect/i,
  /sign up for free/i,
  /opera browser connector/i,
  /plugin search/i,
  /available integrations/i,
  /connect an app/i,
];

export function looksLikePluginUILeak(
  text: string,
): boolean {
  return PLUGIN_UI_LEAK_PATTERNS.some(
    (pattern) => pattern.test(text),
  );
}

/*
 * ============================================================
 * 5. FINGERPRINT HELPERS
 * ============================================================
 */

function stableStringify(
  value: unknown,
): string {
  if (value === null) {
    return "null";
  }

  if (value === undefined) {
    return "undefined";
  }

  if (typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value
      .map((item) =>
        stableStringify(item),
      )
      .join(",")}]`;
  }

  const record =
    value as Record<string, unknown>;

  const keys =
    Object.keys(record).sort();

  return `{${keys
    .map(
      (key) =>
        `${JSON.stringify(
          key,
        )}:${stableStringify(
          record[key],
        )}`,
    )
    .join(",")}}`;
}

function fingerprintValue(
  value: unknown,
): string {
  return stableStringify(value);
}

function fingerprintToolCall(
  toolCall: AgentToolCall,
): string {
  return `${toolCall.name}:${fingerprintValue(
    toolCall.input,
  )}`;
}

function fingerprintToolResult(
  output: unknown,
): string {
  return fingerprintValue(output);
}

function buildRoundSignature(
  toolCalls: AgentToolCall[],
): string {
  return toolCalls
    .map(fingerprintToolCall)
    .join("||");
}

/*
 * ============================================================
 * 6. ERROR HELPERS
 * ============================================================
 */

function getErrorMessage(
  error: unknown,
): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function isBrowserClosedError(
  error: unknown,
): boolean {
  const message =
    getErrorMessage(error).toLowerCase();

  return (
    message.includes(
      "target page, context or browser has been closed",
    ) ||
    message.includes(
      "target closed",
    ) ||
    message.includes(
      "browser has been closed",
    ) ||
    message.includes(
      "context has been closed",
    ) ||
    message.includes(
      "page has been closed",
    ) ||
    message.includes(
      "browser.newpage: target page, context or browser has been closed",
    ) ||
    message.includes(
      "browser is disconnected",
    )
  );
}

function assertBrowserConnected(
  browser: Browser,
): void {
  if (!browser.isConnected()) {
    throw new Error(
      "Playwright browser is closed or disconnected.",
    );
  }
}

/*
 * ============================================================
 * 7. JSON EXTRACTION / CLEANING
 * ============================================================
 */

function extractBalancedJson(
  text: string,
): string | null {
  log(
    `Parsing model response (${text.length} chars)...`,
  );

  const start =
    text.indexOf("{");

  if (start === -1) {
    logError(
      "Could not find the start of a JSON object in the model response.",
    );

    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (
    let i = start;
    i < text.length;
    i++
  ) {
    const char =
      text[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) {
      continue;
    }

    if (char === "{") {
      depth++;
    }

    if (char === "}") {
      depth--;

      if (depth === 0) {
        const extracted =
          text.slice(
            start,
            i + 1,
          );

        log(
          `Balanced JSON extracted (${extracted.length} chars).`,
        );

        return extracted;
      }
    }
  }

  logError(
    "JSON object started but never reached balanced closing brace.",
  );

  return null;
}

export function cleanModelResponse(
  rawResponse: string,
): string {
  if (!rawResponse) {
    return "";
  }

  const balanced =
    extractBalancedJson(
      rawResponse,
    );

  if (balanced) {
    return balanced.trim();
  }

  const firstBrace =
    rawResponse.indexOf("{");

  const lastBrace =
    rawResponse.lastIndexOf("}");

  if (
    firstBrace !== -1 &&
    lastBrace !== -1 &&
    lastBrace > firstBrace
  ) {
    return rawResponse
      .slice(
        firstBrace,
        lastBrace + 1,
      )
      .trim();
  }

  return rawResponse.trim();
}

/*
 * ============================================================
 * 8. TOOL CALL NORMALIZATION
 * ============================================================
 */

function normalizeToolCalls(
  rawToolCalls: unknown,
): unknown[] {
  if (!Array.isArray(rawToolCalls)) {
    return [];
  }

  return rawToolCalls.map(
    (rawCall, index) => {
      if (
        !rawCall ||
        typeof rawCall !== "object"
      ) {
        return rawCall;
      }

      const record =
        rawCall as Record<
          string,
          unknown
        >;

      const normalized: Record<
        string,
        unknown
      > = {
        ...record,
      };

      /*
       * Normalize common aliases only because some models
       * occasionally produce them.
       */
      if (
        normalized.input === undefined &&
        normalized.arguments !== undefined
      ) {
        normalized.input =
          normalized.arguments;
      }

      if (
        normalized.input === undefined &&
        normalized.args !== undefined
      ) {
        normalized.input =
          normalized.args;
      }

      if (
        normalized.input === undefined &&
        normalized.parameters !== undefined
      ) {
        normalized.input =
          normalized.parameters;
      }

      /*
       * Normalize missing id.
       */
      if (
        typeof normalized.id !== "string"
      ) {
        const name =
          typeof normalized.name === "string"
            ? normalized.name
            : "tool";

        normalized.id =
          `normalized_${name}_${index + 1}`;
      }

      delete normalized.arguments;
      delete normalized.args;
      delete normalized.parameters;

      return normalized;
    },
  );
}

/*
 * ============================================================
 * 9. RESPONSE PARSING
 * ============================================================
 */

export function parseAgentReply(
  rawText: string,
): AgentReply {
  /*
   * Clean/extract the JSON first.
   *
   * ChatGPT UI text may appear before or after the JSON because the
   * underlying browser transport is ChatGPT itself.
   *
   * A valid Automatio payload should not be rejected merely because
   * unrelated UI text exists outside the payload.
   */
  const cleanedText =
    cleanModelResponse(
      rawText,
    );

  if (!cleanedText) {
    throw new Error(
      "Could not find a valid JSON object in response.",
    );
  }

  let parsed: unknown;

  try {
    parsed =
      JSON.parse(
        cleanedText,
      );

    log(
      "JSON.parse succeeded.",
    );
  } catch (parseError) {
    logWarn(
      "JSON.parse failed. Attempting jsonrepair.",
      parseError,
    );

    try {
      const repaired =
        jsonrepair(
          cleanedText,
        );

      parsed =
        JSON.parse(
          repaired,
        );

      log(
        "jsonrepair + repaired JSON.parse succeeded.",
      );
    } catch (repairError) {
      logError(
        "jsonrepair / repaired JSON.parse failed.",
        repairError,
      );

      if (
        looksLikePluginUILeak(
          rawText,
        )
      ) {
        throw new Error(
          "ChatGPT UI leak detected and no valid Automatio JSON payload could be extracted.",
        );
      }

      throw new Error(
        `Could not parse agent JSON: ${getErrorMessage(
          repairError,
        )}`,
      );
    }
  }

  if (
    !parsed ||
    typeof parsed !== "object"
  ) {
    throw new Error(
      "Agent response JSON must be an object.",
    );
  }

  const parsedRecord =
    parsed as Record<
      string,
      unknown
    >;

  /*
   * Defaults.
   */
  if (
    parsedRecord.done === undefined
  ) {
    parsedRecord.done = false;
  }

  if (
    parsedRecord.result === undefined
  ) {
    parsedRecord.result = {};
  }

  if (
    parsedRecord.toolCalls === undefined
  ) {
    parsedRecord.toolCalls = [];
  }

  if (
    parsedRecord.answer === undefined
  ) {
    parsedRecord.answer = "";
  }

  /*
   * Normalize tool-call aliases before validation.
   */
  parsedRecord.toolCalls =
    normalizeToolCalls(
      parsedRecord.toolCalls,
    );

  try {
    const validated =
      AgentReplySchema.parse(
        parsedRecord,
      );

    log(
      "Agent reply passed Zod validation.",
      {
        answerLength:
          validated.answer.length,
        toolCallCount:
          validated.toolCalls.length,
        done:
          validated.done,
        hasResult:
          validated.result !==
            null &&
          validated.result !==
            undefined,
      },
    );

    return validated;
  } catch (validationError) {
    logError(
      "Agent reply failed Zod validation.",
      validationError,
    );

    log(
      "Invalid parsed agent reply:",
      parsedRecord,
    );

    throw validationError;
  }
}

/*
 * ============================================================
 * 10. URL HELPERS
 * ============================================================
 */

function normalizeUrl(
  url: string,
): string {
  const trimmed =
    url.trim();

  try {
    return new URL(
      trimmed,
    ).toString();
  } catch {
    return trimmed;
  }
}

function isValidHttpUrl(
  url: string,
): boolean {
  try {
    const parsed =
      new URL(
        url,
      );

    return (
      parsed.protocol === "http:" ||
      parsed.protocol === "https:"
    );
  } catch {
    return false;
  }
}

/*
 * ============================================================
 * 11. LOOP DETECTION
 * ============================================================
 */

function detectToolCallLoop(
  context: AgentContext,
  toolCalls: AgentToolCall[],
): void {
  if (toolCalls.length === 0) {
    return;
  }

  const roundSignature =
    buildRoundSignature(
      toolCalls,
    );

  context.recentRoundSignatures.push(
    roundSignature,
  );

  if (
    context.recentRoundSignatures.length >
    10
  ) {
    context.recentRoundSignatures.shift();
  }

  let consecutiveSameRounds =
    1;

  for (
    let i =
      context.recentRoundSignatures.length -
      2;
    i >= 0;
    i--
  ) {
    if (
      context.recentRoundSignatures[i] !==
      roundSignature
    ) {
      break;
    }

    consecutiveSameRounds++;
  }

  if (
    consecutiveSameRounds >=
    MAX_IDENTICAL_ROUND_SIGNATURES
  ) {
    logError(
      "Agent loop detected: identical tool-call batch repeated multiple times.",
      {
        roundSignature,
        consecutiveSameRounds,
      },
    );

    throw new Error(
      "Agent stopped because it repeated the same tool-call sequence multiple times without making progress.",
    );
  }

  for (
    const toolCall of toolCalls
  ) {
    const fingerprint =
      fingerprintToolCall(
        toolCall,
      );

    const count =
      (context.repeatedToolCalls.get(
        fingerprint,
      ) ?? 0) + 1;

    context.repeatedToolCalls.set(
      fingerprint,
      count,
    );

    if (
      count >
      MAX_IDENTICAL_TOOL_CALLS
    ) {
      logError(
        "Agent loop detected: identical tool call repeated too many times.",
        {
          toolCall,
          count,
        },
      );

      throw new Error(
        `Agent stopped because the tool "${toolCall.name}" was called repeatedly with the same input without sufficient progress.`,
      );
    }
  }
}

/*
 * ============================================================
 * 12. SYSTEM OVERVIEW LOADING
 * ============================================================
 */

async function loadSystemOverview(): Promise<string> {
  log(
    "Loading authoritative system overview before starting agent...",
  );

  try {
    const output =
      await callSystemFiles([
        SYSTEM_OVERVIEW_PATH,
      ]);

    if (
      !Array.isArray(output)
    ) {
      throw new Error(
        "system/overview.md returned an unexpected response shape.",
      );
    }

    const overviewEntry =
      output.find(
        (item) =>
          item &&
          typeof item === "object" &&
          "file" in item &&
          (
            item as Record<
              string,
              unknown
            >
          ).file ===
            SYSTEM_OVERVIEW_PATH,
      ) as
        | Record<string, unknown>
        | undefined;

    if (!overviewEntry) {
      throw new Error(
        "system/overview.md was not returned by callSystemFiles.",
      );
    }

    if (
      overviewEntry.error
    ) {
      throw new Error(
        `Failed to load ${SYSTEM_OVERVIEW_PATH}: ${String(
          overviewEntry.error,
        )}`,
      );
    }

    const content =
      overviewEntry.content;

    if (
      typeof content !== "string" ||
      content.length === 0
    ) {
      throw new Error(
        `Failed to load ${SYSTEM_OVERVIEW_PATH}: file content is empty.`,
      );
    }

    log(
      `Authoritative system overview loaded successfully (${content.length} chars).`,
    );

    return content;
  } catch (error) {
    logError(
      "Failed to load authoritative system overview.",
      error,
    );

    throw error;
  }
}

/*
 * ============================================================
 * 13. PROMPT BUILDERS
 * ============================================================
 *
 * PROMPT-SIZE FIX
 * ------------------------------------------------------------
 * Continuation/corrective prompts used to re-embed, every
 * single round:
 *
 *   - the full system/overview.md text
 *   - the full previous AgentReply, JSON-stringified
 *   - the full latest toolResults, JSON-stringified
 *     (including raw fetch_page HTML dumps, which were
 *     20k+ chars for a single page)
 *
 * That meant prompt size grew every round and, worse, only the
 * MOST RECENT tool result was visible to the model - earlier
 * discoveries (e.g. the login page fetched in round 2) were not
 * repeated once round 4 fetched the products page, so from the
 * model's point of view in round 5 the login page's content had
 * effectively fallen out of view. Re-fetching it was a rational
 * response to that missing context, not just a bug in the model.
 *
 * Fix: keep a small ACCUMULATED map of every page fetched so far
 * (context.discoveredPages) and every system file loaded so far
 * (context.loadedSystemFileContents), and emit a compact recap
 * of ALL of them every round - not just the latest round's raw
 * tool output, and not the full system overview after round 1.
 */

function buildDiscoveredPagesRecap(
  context: AgentContext,
): string {
  if (
    context.discoveredPages.size === 0
  ) {
    return "No pages fetched yet.";
  }

  const entries =
    [...context.discoveredPages.values()];

  return entries
    .map((page) => {
      return [
        `URL: ${page.url}`,
        `(fetched in round ${page.fetchedAtRound})`,
        summarizeText(
          page.content,
          CARRIED_PAGE_CONTENT_CHARS,
        ),
      ].join("\n");
    })
    .join(
      "\n\n----------------------------------------\n\n",
    );
}

function buildLoadedSystemFilesRecap(
  context: AgentContext,
): string {
  if (
    context.loadedSystemFileContents.size ===
    0
  ) {
    return "No node/workflow documentation files loaded yet.";
  }

  const entries =
    [...context.loadedSystemFileContents.entries()];

  return entries
    .map(([file, content]) => {
      return [
        `FILE: ${file}`,
        summarizeText(
          content,
          2000,
        ),
      ].join("\n");
    })
    .join(
      "\n\n----------------------------------------\n\n",
    );
}

/**
 * True once every discovery signal the model would plausibly
 * need has already been gathered at least once: at least one
 * system file (beyond the overview) and at least one page.
 *
 * This is intentionally conservative - it does not try to
 * guess exactly which URLs/files the task needs. It is only
 * used to strengthen the "stop discovering, start building"
 * instruction once SOME discovery has clearly already happened,
 * which is the situation that produced the original infinite
 * fetch_page loop (rounds 3-5 re-fetched pages that had already
 * been fetched successfully in rounds 1-4).
 */
function hasLikelyEnoughToBuildNodes(
  context: AgentContext,
): boolean {
  return (
    context.discoveredPages.size > 0 &&
    context.loadedSystemFileContents.size >
      0
  );
}

export function createInitialPrompt(
  userPrompt: string,
  systemOverview: string,
): string {
  return `
You are the WORKFLOW PARSER AND PLANNER inside Automatio.

You are NOT ChatGPT's normal interactive assistant.

You are NOT a browser agent.

You are NOT an automation runtime.

You are a HEADLESS JSON PARSER whose output is consumed by
ANOTHER PROGRAM.

Your only job is:

1. Understand the user's requested automation.
2. Use Automatio's authoritative system documentation.
3. Request discovery information by returning JSON tool-call directives.
4. Inspect webpages through the fetch_page directive when page-specific
   information is required.
5. Construct an Automatio workflow as JSON.
6. Return that JSON to the calling program.

ANOTHER PROGRAM will read your JSON output and execute the requested
tool directives and, later, the generated workflow.

YOU DO NOT EXECUTE THE WORKFLOW YOURSELF.

============================================================
ABSOLUTE EXECUTION BOUNDARY
============================================================

You are a planning/parser layer.

Automatio's runtime is a DIFFERENT PROGRAM.

Your response is DATA for that program.

Therefore:

- You do not click websites yourself.
- You do not fill forms yourself.
- You do not send Telegram messages yourself.
- You do not log into websites yourself.
- You do not execute browser automation yourself.
- You do not execute API requests yourself.
- You do not execute integrations yourself.
- You do not perform the requested business operation yourself.

You ONLY construct the workflow and return JSON instructions for the
Automatio runner.

============================================================
YOU DO NOT HAVE ACTUAL TOOLS
============================================================

You do NOT have actual callable tools.

You do NOT have a real ChatGPT tool interface.

You do NOT have native access to:

- call_system_files
- fetch_page
- browser tools
- plugins
- connectors
- integrations
- external APIs
- ChatGPT actions

Automatio uses a TEXT-BASED TOOL PROTOCOL.

You request information by returning JSON.

ANOTHER PROGRAM reads that JSON, executes the requested directive,
and sends the result back to you in a later prompt.

REQUESTING A TOOL = RETURNING JSON.

REQUESTING A TOOL DOES NOT MEAN YOU EXECUTED IT.

============================================================
CRITICAL DISTINCTION:
DISCOVERY DIRECTIVES VS WORKFLOW NODES
============================================================

There are TWO completely different concepts.

------------------------------------------------------------
DISCOVERY DIRECTIVES
------------------------------------------------------------

These are the ONLY things allowed inside "toolCalls":

- call_system_files
- fetch_page

Nothing else is allowed in "toolCalls".

------------------------------------------------------------
WORKFLOW NODES
------------------------------------------------------------

Workflow nodes NEVER belong inside "toolCalls".

Workflow nodes include whatever node types are documented under
nodes/, including examples such as:

- trigger
- goto
- click
- fill
- select
- check
- uncheck
- press
- wait
- wait_for_element
- screenshot
- extract_text
- assert_text
- assert_value
- condition
- loop
- parallel
- telegram
- end

These are workflow nodes, NOT planning directives.

Workflow nodes MUST be placed inside:

{
  "result": {
    "nodes": [...],
    "edges": [...]
  }
}

WRONG:

{
  "toolCalls": [
    {
      "id": "call_1",
      "name": "click",
      "input": {
        "selector": "[data-testid='login-button']"
      }
    }
  ]
}

CORRECT:

{
  "toolCalls": [],
  "result": {
    "nodes": [
      {
        "position": 0,
        "type": "trigger",
        "title": "Start",
        "description": "",
        "config": {}
      },
      {
        "position": 1,
        "type": "click",
        "title": "Open Login",
        "description": "",
        "config": {
          "selector": "[data-testid='login-button']"
        }
      }
    ],
    "edges": [
      {
        "source": 0,
        "target": 1
      }
    ]
  },
  "done": false,
  "answer": ""
}

IMPORTANT:

"click" is NEVER a tool call.

"fill" is NEVER a tool call.

"goto" is NEVER a tool call.

"wait_for_element" is NEVER a tool call.

"extract_text" is NEVER a tool call.

"telegram" is NEVER a tool call.

"end" is NEVER a tool call.

They are workflow nodes.

Only call_system_files and fetch_page may appear in toolCalls.

============================================================
ARCHITECTURE
============================================================

USER
  ↓
YOUR JSON PARSER
  ↓
JSON TOOL DIRECTIVES
  ↓
AUTOMATIO RUNNER
  ↓
TOOL RESULTS
  ↓
YOUR JSON PARSER
  ↓
AUTOMATIO WORKFLOW JSON
  ↓
AUTOMATIO RUNTIME
  ↓
ACTUAL EXECUTION

You are ONLY the JSON parser/planner.

============================================================
USER TASK
============================================================

${userPrompt}

============================================================
AUTHORITATIVE SYSTEM OVERVIEW
============================================================

The Automatio runner loaded system/overview.md BEFORE asking you
to plan this workflow.

The complete contents are included below.

This is the authoritative index of the Automatio knowledge tree.

Use it to determine:

- available node types
- available documentation files
- workflow documentation
- integration documentation
- exact documentation paths
- which files are relevant to the user's request

DO NOT invent documentation paths.

DO NOT guess file names.

DO NOT assume a file exists merely because its name sounds logical.

------------------------------------------------------------
system/overview.md
------------------------------------------------------------

${systemOverview}

------------------------------------------------------------
END system/overview.md
------------------------------------------------------------

IMPORTANT:

system/overview.md is ALREADY LOADED.

Do NOT request system/overview.md.

NOTE: starting from the NEXT round, this full overview text will
NOT be repeated in every prompt (to keep prompts small). You will
instead be given a short recap of what has already been
discovered/loaded. The rules in this document remain in force for
the entire task even when not restated verbatim.

============================================================
SYSTEM DOCUMENTATION PROCESS
============================================================

The required process is:

1. Read the embedded system overview.
2. Identify the exact relevant documentation files.
3. Return a call_system_files JSON directive for those files.
4. Wait for the runner to execute that directive.
5. Use the returned documentation.
6. Construct the workflow.

NEVER invent documentation paths.

NEVER assume a guessed filename exists.

NEVER request a file again once its successful content has already been
returned.

============================================================
PAGE DISCOVERY PROCESS
============================================================

Use fetch_page when actual webpage information must be discovered.

fetch_page is a DISCOVERY DIRECTIVE.

It is NOT a workflow node.

Use fetch_page for page-dependent information including:

- clicking
- filling
- selecting
- extracting text
- extracting titles
- extracting prices
- asserting text
- asserting values
- finding links
- identifying forms
- determining actual page structure
- determining actual selectors

NEVER invent selectors from the user's wording.

Correct process:

1. request fetch_page
2. inspect returned page content
3. identify the actual element
4. use the inspected selector in the workflow result

Do not repeatedly fetch the same unchanged page merely because the next
step is a workflow node.

ONCE A URL HAS BEEN FETCHED SUCCESSFULLY, IT WILL NOT BE FETCHED
AGAIN. Any further fetch_page request for a URL that already
succeeded will be REJECTED by the runner. If you need information
from a page you already fetched, use the recap/summary you were
already given instead of requesting it again.

============================================================
SELECTOR RULES
============================================================

Selectors MUST come from fetch_page results.

Prefer:

1. data-testid
2. unique id
3. stable aria/accessibility attribute
4. stable semantic selector
5. carefully constructed CSS selector

NEVER invent:

- IDs
- data-testid values
- class names
- attributes
- CSS selectors

A semantic word from the user's request is NOT automatically a valid
selector.

============================================================
CREDENTIALS
============================================================

Use user-provided credentials exactly as provided.

Never:

- guess credentials
- modify credentials
- fabricate credentials
- claim to log in
- execute the login yourself

Credentials become workflow configuration for another program.

============================================================
INTEGRATIONS
============================================================

Integration IDs supplied by the user are workflow configuration.

Use them according to authoritative integration/node documentation.

You are NOT executing the integration.

You are constructing the integration node.

Do NOT claim that an integration executed.

Do NOT claim that a Telegram message was sent.

============================================================
CONFIGURATION AUTHORITY
============================================================

Every workflow node configuration MUST match its authoritative node
documentation exactly.

Documentation wins over intuition.

If nodes/telegram.md defines:

"integration_id"

then use:

"integration_id"

Do NOT invent or rename it to:

- chat_id
- telegram_id
- recipient
- channel_id

unless the authoritative documentation explicitly defines that field.

The same rule applies to every node.

============================================================
WORKFLOW CONSTRUCTION
============================================================

Build the smallest reliable workflow that completely satisfies the
user.

Preserve valid workflow work already created.

Do not restart unnecessarily.

Every node must have a clear purpose.

The final workflow must be:

{
  "nodes": [...],
  "edges": [...]
}

Use exact node types and exact config fields from authoritative
documentation.

Do NOT include persistence fields such as:

- id
- automation_id
- created_at
- updated_at
- position_x
- position_y

Automatio handles those internally.

============================================================
DYNAMIC DATA VS WORKFLOW CONSTRUCTION
============================================================

The user may ask for information that changes at runtime.

Examples:

- current orders
- current prices
- current pending items
- today's messages
- latest notifications

Do NOT claim to know those dynamic values while constructing the
workflow.

Instead construct workflow nodes that retrieve those values when the
workflow executes.

Example:

User asks:

"Find my pending orders and send them to Telegram."

Correct:

login
→ open orders
→ obtain current orders
→ identify pending orders
→ send the resulting runtime data to Telegram

Incorrect:

Claiming that you already know today's pending orders.

The planner constructs the procedure.

The runtime discovers the current data.

============================================================
TRIGGER / END
============================================================

A valid workflow requires:

- exactly one trigger
- trigger at position 0
- exactly one end node
- end at the final/highest position
- unique contiguous positions
- valid edges

General pattern:

trigger
→ step
→ step
→ ...
→ end

============================================================
NO LOOPING / BUILD AS SOON AS YOU CAN
============================================================

Make meaningful progress on every round.

Do NOT repeatedly request the same documentation when its successful
result is already available.

Do NOT repeatedly request the same page when its successful result
already contains the required information.

As soon as you have:

1. every node-type documentation file you need, AND
2. every page fetch you need to determine real selectors/fields,

STOP requesting more discovery and IMMEDIATELY construct
result.nodes / result.edges in that same response. Do not perform an
extra "confirmation" fetch or file request once you already have what
a step needs - build the node instead.

If a directive fails:

1. understand the failure
2. identify the cause
3. make one reasonable correction
4. request the corrected directive once when appropriate

Do not blindly repeat identical failures.

============================================================
OUTPUT CONTRACT
============================================================

Your response is an API payload consumed by another program.

You MUST respond with exactly ONE raw JSON object.

No markdown.

No code fences.

No commentary.

No conversational prose outside JSON.

Required structure:

{
  "answer": "",
  "toolCalls": [],
  "result": {},
  "done": false
}

Every tool call MUST be:

{
  "id": "call_1",
  "name": "call_system_files",
  "input": {
    "files": ["nodes/example.md"]
  }
}

OR:

{
  "id": "call_2",
  "name": "fetch_page",
  "input": {
    "url": "https://example.com"
  }
}

NEVER use:

- "arguments"
- "args"
- "parameters"

Rules:

- answer = string
- toolCalls = array
- result = object
- done = boolean
- done is top-level
- never put done inside result
- call_system_files uses input.files
- fetch_page uses input.url
- do not expose internal reasoning
- do not claim a directive executed before the runner returns its result
- do not claim workflow execution
- do not claim browser execution
- do not claim integration execution

============================================================
COMPLETION
============================================================

When the workflow is actually complete:

{
  "answer": "I created the workflow.",
  "toolCalls": [],
  "result": {
    "nodes": [...],
    "edges": [...]
  },
  "done": true
}

"I created the workflow" means:

"I constructed the workflow JSON."

It does NOT mean:

"I executed the workflow."

Return ONLY the JSON object.
`.trim();
}

/**
 * Compact continuation prompt.
 *
 * Unlike the previous version, this does NOT re-embed:
 *
 * - the full system/overview.md text
 * - the full previous AgentReply JSON
 * - the full raw toolResults JSON (which included entire
 *   fetch_page HTML dumps)
 *
 * Instead it sends a bounded recap built from context.discoveredPages
 * and context.loadedSystemFileContents (both accumulated across the
 * whole run), plus the current workflow result. All the rules from
 * the initial prompt remain in effect; only the repeated bulk text
 * is trimmed.
 */
export function createContinuationPrompt(
  context: AgentContext,
  previousReply: AgentReply,
): string {
  const discoveredPagesRecap =
    buildDiscoveredPagesRecap(
      context,
    );

  const loadedSystemFilesRecap =
    buildLoadedSystemFilesRecap(
      context,
    );

  const readyToBuildNudge =
    hasLikelyEnoughToBuildNodes(
      context,
    )
      ? [
          "",
          "============================================================",
          "YOU LIKELY ALREADY HAVE ENOUGH TO BUILD NODES",
          "============================================================",
          "",
          "You have at least one page fetch and at least one node",
          "documentation file already available below. Before requesting",
          "ANY further discovery, check whether the recap below already",
          "answers what the next workflow step needs. If it does, build",
          "or extend result.nodes/result.edges now instead of calling",
          "fetch_page or call_system_files again.",
        ].join("\n")
      : "";

  return `
Continue the existing Automatio workflow-building task.

You are continuing from existing state. Do NOT restart.

You are a HEADLESS JSON PARSER AND WORKFLOW PLANNER - not the
workflow runtime, not a browser agent, not an integration executor,
not a ChatGPT web agent. ANOTHER PROGRAM consumes your JSON and
executes the requested directives and workflow later.

The ONLY valid names inside "toolCalls" are call_system_files and
fetch_page. Workflow nodes (trigger, goto, click, fill, select,
check, uncheck, press, wait, wait_for_element, screenshot,
extract_text, assert_text, assert_value, condition, loop, parallel,
telegram, end, and any other type documented under nodes/) NEVER go
in toolCalls - they belong in result.nodes, each with a numeric
"position", string "type", string "title", and object "config".

============================================================
ORIGINAL USER REQUEST
============================================================

${context.userPrompt}

============================================================
CURRENT WORKFLOW RESULT (result.nodes / result.edges so far)
============================================================

${JSON.stringify(
  context.result,
  null,
  2,
)}

============================================================
PAGES ALREADY FETCHED (do NOT fetch_page these URLs again)
============================================================

${discoveredPagesRecap}

============================================================
NODE/WORKFLOW DOCUMENTATION ALREADY LOADED (do NOT request again)
============================================================

${loadedSystemFilesRecap}
${readyToBuildNudge}

============================================================
LAST RESPONSE SUMMARY
============================================================

answer: ${summarizeText(
    previousReply.answer,
    300,
  )}
done: ${previousReply.done}
toolCalls requested: ${previousReply.toolCalls
    .map((call) => call.name)
    .join(", ") || "(none)"}

============================================================
RULES (unchanged from the original task instructions)
============================================================

- Only call_system_files and fetch_page may appear in toolCalls.
- NEVER request system/overview.md.
- NEVER request a system file already listed above as loaded.
- NEVER fetch_page a URL already listed above as fetched.
- Selectors MUST come from the fetched page content shown above -
  never invented.
- Every workflow node config MUST match its authoritative node file
  exactly - never invent config keys.
- If the user asks for runtime/dynamic data, build nodes that
  retrieve it at runtime; do not claim to already know it.
- A valid workflow needs exactly one trigger at position 0, exactly
  one end node at the final position, unique contiguous positions,
  and valid edges.
- Do not claim execution of clicks, fills, logins, or integrations -
  you only construct JSON.

============================================================
CURRENT TASK
============================================================

Determine what is genuinely still missing (if anything), then take
ONLY the next useful action:

1. request one genuinely new, not-yet-fetched URL or not-yet-loaded
   documentation file, OR
2. construct/extend/correct result.nodes and result.edges using the
   information already available above, OR
3. finish with done:true once the workflow is structurally complete.

Repeating an already-successful discovery call is NOT progress and
will be rejected.

============================================================
OUTPUT
============================================================

Return exactly ONE raw JSON object, no markdown, no commentary:

{
  "answer": "",
  "toolCalls": [],
  "result": {},
  "done": false
}

When complete:

{
  "answer": "I created the workflow.",
  "toolCalls": [],
  "result": {
    "nodes": [...],
    "edges": [...]
  },
  "done": true
}

Return ONLY the JSON object.
`.trim();
}

/*
 * ============================================================
 * 14. CORRECTIVE PROMPT
 * ============================================================
 *
 * Also trimmed: no more full system overview / full previous
 * reply dump. Uses the same compact recap as the continuation
 * prompt, plus the specific error text and correction guidance.
 */

export function createCorrectivePrompt(
  originalPrompt: string,
  context: AgentContext,
  reason:
    | "plugin_leak"
    | "schema_error"
    | "no_progress",
  errorText: string,
  previousReply:
    | AgentReply
    | null,
): string {
  const discoveredPagesRecap =
    buildDiscoveredPagesRecap(
      context,
    );

  const loadedSystemFilesRecap =
    buildLoadedSystemFilesRecap(
      context,
    );

  return `
Continue the Automatio workflow-building task.

You previously returned an invalid or unusable response. Do NOT
restart the task. Preserve all valid workflow information already
available.

============================================================
ORIGINAL USER REQUEST
============================================================

${originalPrompt}

============================================================
CURRENT VALID WORKFLOW STATE
============================================================

${JSON.stringify(
  context.result,
  null,
  2,
)}

============================================================
PAGES ALREADY FETCHED (do NOT fetch_page these URLs again)
============================================================

${discoveredPagesRecap}

============================================================
NODE/WORKFLOW DOCUMENTATION ALREADY LOADED (do NOT request again)
============================================================

${loadedSystemFilesRecap}

============================================================
PREVIOUS ANSWER (for context only)
============================================================

${
    previousReply
      ? summarizeText(
          previousReply.answer,
          300,
        )
      : "(no previous reply)"
  }

============================================================
ERROR
============================================================

${errorText}

============================================================
CORRECTION
============================================================

${getCorrectionInstructions(
  reason,
)}

============================================================
ABSOLUTE TOOL/NODE DISTINCTION
============================================================

Only these two names are valid inside "toolCalls": call_system_files
and fetch_page. Workflow nodes (trigger, goto, click, fill,
wait_for_element, extract_text, telegram, end, and every other node
documented under nodes/) NEVER belong in toolCalls - they go in
result.nodes.

============================================================
STRICT JSON TOOL FORMAT
============================================================

{
  "id": "call_1",
  "name": "call_system_files",
  "input": { "files": ["nodes/example.md"] }
}

OR:

{
  "id": "call_2",
  "name": "fetch_page",
  "input": { "url": "https://example.com" }
}

NEVER use "arguments", "args", or "parameters" as the key.

Do not request system/overview.md - already available. Do not
request already-loaded files or already-fetched URLs listed above.

============================================================
OUTPUT
============================================================

Return exactly ONE raw JSON object. No markdown. No commentary. No
ChatGPT UI. No plugins. No connectors. No browser-agent language. Do
not claim execution.

Correct the response using the information already available above.

Return the corrected JSON now.
`.trim();
}

function getCorrectionInstructions(
  reason:
    | "plugin_leak"
    | "schema_error"
    | "no_progress",
): string {
  switch (reason) {
    case "plugin_leak":
      return `
The browser transport contained ChatGPT UI text.

Ignore that UI text.

Return ONLY the Automatio JSON API payload.

Do not mention ChatGPT UI.
Do not request plugins.
Do not request connectors.
Do not request integrations.
Do not behave like a web operator.
`;

    case "schema_error":
      return `
Your previous response violated the Automatio API contract.

Required top-level fields:

- answer
- toolCalls
- result
- done

Required tool-call fields:

- id
- name
- input

Use "input", NEVER "arguments".

Only call_system_files and fetch_page are valid planning directives.

Workflow nodes must be inside result.nodes.

Preserve existing valid workflow state.

Correct only what is invalid.
`;

    case "no_progress":
      return `
Your previous response did not make progress - most likely it
re-requested a URL or documentation file that was already fetched
successfully. That is now blocked by the runner.

Use the recap already provided above; do not repeat the same
discovery action.

Either:

1. perform one genuinely new discovery action (a URL or file NOT
   listed in the recap above),
2. construct/extend/correct result.nodes and result.edges using the
   information already available in the recap, or
3. complete the workflow with done:true.

If everything the task needs is already in the recap above, you MUST
build result.nodes now rather than requesting more discovery.

Do not return another empty response.
`;

    default:
      return `
Return a valid Automatio workflow-planning JSON response.
`;
  }
}

/*
 * ============================================================
 * 15. TOOL INPUT SCHEMAS
 * ============================================================
 */

const fetchPageInputSchema =
  FetchPageSchema;

const callSystemFilesInputSchema =
  CallSystemFilesSchema;

/*
 * ============================================================
 * 16. TOOL VALIDATION
 * ============================================================
 */

/**
 * Validate planning directives.
 *
 * IMPORTANT:
 *
 * Invalid tool names are NOT silently dropped anymore.
 *
 * If the model returns:
 *
 *   click
 *   fill
 *   goto
 *   telegram
 *
 * inside toolCalls, the runner returns a corrective error to the model.
 *
 * This prevents:
 *
 * model -> click
 * runner -> silently deletes click
 * model -> fetch_page again
 * model -> click
 * ...
 *
 * ALSO, as of this revision: fetch_page requests for a URL that has
 * ALREADY succeeded are rejected here deterministically, rather than
 * relying on the prompt alone to stop the model from re-fetching. This
 * is what previously produced the "fetch_page repeatedly returned the
 * same result without progress" failure - the prompt said not to
 * re-fetch, but nothing enforced it until the anti-loop safety net
 * kicked in and killed the whole run. Now it is rejected up front,
 * with a corrective message, the same way an invalid tool name is.
 */
export function validateToolCalls(
  toolCalls: AgentToolCall[],
  loadedSystemFiles:
    Set<string> = new Set<string>(),
  fetchedUrls:
    Set<string> = new Set<string>(),
): ToolValidationResult {
  log(
    `Validating ${toolCalls.length} tool call(s).`,
  );

  const seenIds =
    new Set<string>();

  const validCalls:
    AgentToolCall[] = [];

  const errors:
    string[] = [];

  for (
    const originalToolCall of toolCalls
  ) {
    let toolCall =
      originalToolCall;

    if (
      !toolCall.id ||
      !toolCall.name
    ) {
      const message =
        "Tool call is missing required id or name.";

      errors.push(message);

      logWarn(
        message,
        toolCall,
      );

      continue;
    }

    if (
      seenIds.has(
        toolCall.id,
      )
    ) {
      const message =
        `Duplicate tool call id: ${toolCall.id}`;

      errors.push(message);

      logWarn(
        message,
      );

      continue;
    }

    seenIds.add(
      toolCall.id,
    );

    /*
     * ----------------------------------------------------------
     * call_system_files
     * ----------------------------------------------------------
     */

    if (
      toolCall.name ===
      "call_system_files"
    ) {
      const parsed =
        callSystemFilesInputSchema.safeParse(
          toolCall.input,
        );

      if (!parsed.success) {
        const message =
          `Invalid call_system_files input: ${parsed.error.message}`;

        errors.push(message);

        logWarn(
          message,
        );

        continue;
      }

      /*
       * Remove overview because it is runner-managed.
       */
      let requestedFiles =
        parsed.data.files.filter(
          (file) =>
            file !==
            SYSTEM_OVERVIEW_PATH,
        );

      if (
        requestedFiles.length === 0
      ) {
        const message =
          "system/overview.md is already loaded and cannot be requested again.";

        errors.push(message);

        logWarn(
          message,
        );

        continue;
      }

      /*
       * Prevent re-requesting successfully loaded files.
       */
      requestedFiles =
        requestedFiles.filter(
          (file) =>
            !loadedSystemFiles.has(
              file,
            ),
        );

      if (
        requestedFiles.length === 0
      ) {
        const message =
          "All requested system documentation files are already loaded. Do not request them again.";

        errors.push(message);

        logWarn(
          message,
        );

        continue;
      }

      /*
       * Preserve only genuinely new files.
       */
      toolCall = {
        ...toolCall,
        input: {
          files: requestedFiles,
        },
      };

      validCalls.push(
        toolCall,
      );

      continue;
    }

    /*
     * ----------------------------------------------------------
     * fetch_page
     * ----------------------------------------------------------
     */

    if (
      toolCall.name ===
      "fetch_page"
    ) {
      const parsed =
        fetchPageInputSchema.safeParse(
          toolCall.input,
        );

      if (!parsed.success) {
        const message =
          `Invalid fetch_page input: ${parsed.error.message}`;

        errors.push(message);

        logWarn(
          message,
        );

        continue;
      }

      const normalized =
        normalizeUrl(
          parsed.data.url,
        );

      if (
        fetchedUrls.has(
          normalized,
        )
      ) {
        const message =
          `URL already fetched successfully and cannot be requested again: ${normalized}. ` +
          `Use the previously returned content for this URL instead of re-fetching it.`;

        errors.push(message);

        logWarn(
          message,
        );

        continue;
      }

      toolCall = {
        ...toolCall,
        input: {
          ...toolCall.input,
          url: normalized,
        },
      };

      validCalls.push(
        toolCall,
      );

      continue;
    }

    /*
     * ----------------------------------------------------------
     * EVERYTHING ELSE IS A WORKFLOW NODE, NOT A TOOL
     * ----------------------------------------------------------
     */

    const message =
      `Invalid planning directive "${toolCall.name}". ` +
      `Only "call_system_files" and "fetch_page" may appear in toolCalls. ` +
      `"${toolCall.name}" is a workflow node and MUST be placed inside result.nodes.`;

    errors.push(message);

    logWarn(
      message,
      toolCall,
    );
  }

  log(
    `Tool call validation complete: ${validCalls.length} valid call(s), ${errors.length} error(s).`,
  );

  return {
    validCalls,
    errors,
  };
}

/*
 * ============================================================
 * 17. FETCH PAGE TOOL
 * ============================================================
 */

async function executeFetchPage(
  input: unknown,
  browser: Browser,
): Promise<
  FetchedPage | { error: string }
> {
  log(
    "Executing fetch_page tool.",
    input,
  );

  const parsed =
    fetchPageInputSchema.safeParse(
      input,
    );

  if (!parsed.success) {
    logError(
      "fetch_page input validation failed.",
      parsed.error,
    );

    return {
      error:
        "Invalid fetch_page input. Expected { url: string }.",
    };
  }

  assertBrowserConnected(
    browser,
  );

  const url =
    normalizeUrl(
      parsed.data.url,
    );

  if (
    !isValidHttpUrl(url)
  ) {
    logError(
      `fetch_page rejected invalid URL: ${url}`,
    );

    return {
      error: `Invalid HTTP/HTTPS URL: ${url}`,
    };
  }

  try {
    const content =
      await fetchPage(
        url,
        browser,
      );

    log(
      `fetch_page succeeded: ${url}`,
      {
        contentLength:
          content.length,
        contentPreview:
          summarizeText(
            content,
            500,
          ),
      },
    );

    return {
      url,
      content,
    };
  } catch (error) {
    if (
      isBrowserClosedError(
        error,
      )
    ) {
      throw error;
    }

    logError(
      `fetch_page failed: ${url}`,
      error,
    );

    return {
      error:
        getErrorMessage(
          error,
        ),
    };
  }
}

/*
 * ============================================================
 * 18. SYSTEM FILE TOOL
 * ============================================================
 */

async function executeCallSystemFiles(
  input: unknown,
): Promise<unknown> {
  log(
    "Executing call_system_files tool.",
    input,
  );

  const parsed =
    callSystemFilesInputSchema.safeParse(
      input,
    );

  if (!parsed.success) {
    logError(
      "call_system_files input validation failed.",
      parsed.error,
    );

    return {
      error:
        "Invalid call_system_files input. Expected { files: string[] }.",
    };
  }

  const requestedFiles =
    parsed.data.files.filter(
      (file) =>
        file !==
        SYSTEM_OVERVIEW_PATH,
    );

  if (
    requestedFiles.length === 0
  ) {
    return {
      error:
        "system/overview.md is preloaded by the runner and cannot be requested again.",
    };
  }

  try {
    const output =
      await callSystemFiles(
        requestedFiles,
      );

    log(
      "call_system_files succeeded.",
      {
        requestedFiles,
        output:
          summarizeText(
            stringifySafe(
              output,
            ),
            1500,
          ),
      },
    );

    return output;
  } catch (error) {
    logError(
      "call_system_files execution failed.",
      error,
    );

    return {
      error:
        getErrorMessage(
          error,
        ),
    };
  }
}

/*
 * ============================================================
 * 19. SYSTEM FILE / PAGE TRACKING
 * ============================================================
 */

function trackSuccessfullyLoadedSystemFiles(
  context: AgentContext,
  output: unknown,
): void {
  const inspect =
    (value: unknown): void => {
      if (
        Array.isArray(value)
      ) {
        for (
          const item of value
        ) {
          inspect(item);
        }

        return;
      }

      if (
        !value ||
        typeof value !== "object"
      ) {
        return;
      }

      const record =
        value as Record<
          string,
          unknown
        >;

      const file =
        typeof record.file ===
        "string"
          ? record.file
          : null;

      const error =
        record.error;

      const status =
        typeof record.status ===
        "string"
          ? record.status
          : null;

      const contentValue =
        typeof record.content ===
        "string"
          ? record.content
          : null;

      const hasContent =
        !!contentValue &&
        contentValue.length > 0;

      const explicitlyLoaded =
        status === "loaded" &&
        !error;

      if (
        file ===
        SYSTEM_OVERVIEW_PATH
      ) {
        return;
      }

      if (
        file &&
        !error &&
        (
          hasContent ||
          explicitlyLoaded
        )
      ) {
        if (
          !context.loadedSystemFiles.has(
            file,
          )
        ) {
          context.loadedSystemFiles.add(
            file,
          );

          log(
            `System file successfully loaded: ${file}`,
          );
        }

        if (
          contentValue
        ) {
          context.loadedSystemFileContents.set(
            file,
            contentValue,
          );
        }
      }

      for (
        const nestedValue of
          Object.values(record)
      ) {
        if (
          nestedValue &&
          typeof nestedValue ===
            "object"
        ) {
          inspect(
            nestedValue,
          );
        }
      }
    };

  inspect(output);
}

/**
 * Record any newly-fetched page into context.discoveredPages,
 * keyed by normalized URL, WITHOUT overwriting/losing pages
 * fetched in earlier rounds. This is what allows the prompt
 * builder to keep every previously discovered page visible to
 * the model, and what allows validateToolCalls to deterministically
 * reject repeat fetch_page calls for the same URL.
 */
function trackFetchedPages(
  context: AgentContext,
  toolResults: AgentToolResult[],
  round: number,
): void {
  for (
    const result of toolResults
  ) {
    if (
      result.name !==
      "fetch_page"
    ) {
      continue;
    }

    let parsedOutput:
      unknown;

    try {
      parsedOutput =
        JSON.parse(
          result.output,
        );
    } catch {
      continue;
    }

    if (
      !parsedOutput ||
      typeof parsedOutput !==
        "object"
    ) {
      continue;
    }

    const record =
      parsedOutput as Record<
        string,
        unknown
      >;

    if (
      record.error
    ) {
      continue;
    }

    const url =
      typeof record.url ===
      "string"
        ? record.url
        : null;

    const content =
      typeof record.content ===
      "string"
        ? record.content
        : null;

    if (
      !url ||
      !content
    ) {
      continue;
    }

    const normalized =
      normalizeUrl(url);

    if (
      !context.discoveredPages.has(
        normalized,
      )
    ) {
      log(
        `Page successfully discovered and cached: ${normalized}`,
      );
    }

    context.discoveredPages.set(
      normalized,
      {
        url: normalized,
        content,
        fetchedAtRound: round,
      },
    );
  }
}

/*
 * ============================================================
 * 20. TOOL EXECUTION
 * ============================================================
 */

async function executeToolCall(
  toolCall: AgentToolCall,
  browser: Browser,
): Promise<AgentToolResult> {
  log(
    `Executing tool "${toolCall.name}" (${toolCall.id}).`,
  );

  log(
    `Tool input for "${toolCall.name}" (${toolCall.id}):`,
    toolCall.input,
  );

  try {
    let output: unknown;

    switch (
      toolCall.name
    ) {
      case "fetch_page": {
        output =
          await executeFetchPage(
            toolCall.input,
            browser,
          );

        break;
      }

      case "call_system_files": {
        output =
          await executeCallSystemFiles(
            toolCall.input,
          );

        break;
      }

      default: {
        const exhaustiveCheck:
          never =
          toolCall.name;

        throw new Error(
          `Unsupported planning tool: ${exhaustiveCheck}`,
        );
      }
    }

    log(
      `Tool "${toolCall.name}" (${toolCall.id}) finished.`,
      {
        output:
          summarizeText(
            stringifySafe(
              output,
            ),
            1500,
          ),
      },
    );

    return {
      id:
        toolCall.id,
      name:
        toolCall.name,
      output:
        stringifySafe(
          output,
        ),
    };
  } catch (error) {
    logError(
      `Tool "${toolCall.name}" (${toolCall.id}) threw an exception.`,
      error,
    );

    if (
      isBrowserClosedError(
        error,
      )
    ) {
      throw error;
    }

    return {
      id:
        toolCall.id,
      name:
        toolCall.name,
      output:
        stringifySafe({
          error:
            getErrorMessage(
              error,
            ),
        }),
    };
  }
}

/*
 * ============================================================
 * 21. MULTI-TOOL EXECUTION
 * ============================================================
 */

async function executeToolCalls(
  toolCalls: AgentToolCall[],
  browser: Browser,
  context: AgentContext,
): Promise<AgentToolResult[]> {
  log(
    `Executing ${toolCalls.length} tool call(s).`,
  );

  detectToolCallLoop(
    context,
    toolCalls,
  );

  const results:
    AgentToolResult[] =
    [];

  for (
    let index = 0;
    index <
    toolCalls.length;
    index++
  ) {
    const toolCall =
      toolCalls[index];

    log(
      `Starting tool ${index + 1}/${toolCalls.length}: ${toolCall.name} (${toolCall.id})`,
    );

    const result =
      await executeToolCall(
        toolCall,
        browser,
      );

    results.push(
      result,
    );

    const callFingerprint =
      fingerprintToolCall(
        toolCall,
      );

    const outputFingerprint =
      fingerprintToolResult(
        result.output,
      );

    context.toolCallHistory.push({
      fingerprint:
        callFingerprint,
      outputFingerprint,
    });

    if (
      context.toolCallHistory.length >
      MAX_TOOL_HISTORY
    ) {
      context.toolCallHistory.shift();
    }

    log(
      `Finished tool ${index + 1}/${toolCalls.length}: ${toolCall.name} (${toolCall.id})`,
    );
  }

  /*
   * Detect identical calls producing identical results.
   *
   * NOTE: with the fetchedUrls check now enforced in
   * validateToolCalls, this should rarely trigger for fetch_page
   * anymore - repeat fetch_page calls for the same URL are now
   * rejected before execution. This remains as a safety net for
   * any other source of duplicate work (e.g. call_system_files
   * edge cases).
   */
  for (
    const result of results
  ) {
    const matchingCall =
      toolCalls.find(
        (call) =>
          call.id ===
          result.id,
      );

    if (
      !matchingCall
    ) {
      continue;
    }

    const matchingHistory =
      context.toolCallHistory.filter(
        (entry) =>
          entry.fingerprint ===
          fingerprintToolCall(
            matchingCall,
          ),
      );

    if (
      matchingHistory.length >=
      3
    ) {
      const latest =
        matchingHistory[
          matchingHistory.length - 1
        ];

      const previous =
        matchingHistory[
          matchingHistory.length - 2
        ];

      if (
        latest.outputFingerprint ===
        previous.outputFingerprint
      ) {
        logError(
          "Agent produced the same tool call with the same result repeatedly.",
          {
            tool:
              result.name,
            repetitions:
              matchingHistory.length,
          },
        );

        throw new Error(
          `Agent stopped because "${result.name}" repeatedly returned the same result without progress.`,
        );
      }
    }
  }

  log(
    "All tool calls finished.",
    {
      resultCount:
        results.length,
    },
  );

  return results;
}

/*
 * ============================================================
 * 22. WORKFLOW VALIDATION
 * ============================================================
 */

/**
 * Validate structural workflow correctness before accepting done:true.
 *
 * This is deliberately structural rather than node-specific.
 *
 * Exact node config validation belongs to the authoritative node
 * documentation and, ideally, your runtime workflow validator.
 */
export function validateWorkflowResult(
  result: Record<string, unknown>,
): string[] {
  const errors:
    string[] =
    [];

  const nodes =
    result.nodes;

  const edges =
    result.edges;

  if (
    !Array.isArray(nodes)
  ) {
    errors.push(
      "result.nodes must be an array.",
    );

    return errors;
  }

  if (
    !Array.isArray(edges)
  ) {
    errors.push(
      "result.edges must be an array.",
    );
  }

  if (
    nodes.length === 0
  ) {
    errors.push(
      "Workflow must contain at least one node.",
    );

    return errors;
  }

  const positions =
    nodes.map(
      (node) =>
        node &&
        typeof node === "object"
          ? (
              node as Record<
                string,
                unknown
              >
            ).position
          : undefined,
    );

  const expectedPositions =
    Array.from(
      {
        length:
          nodes.length,
      },
      (_, index) =>
        index,
    );

  if (
    JSON.stringify(
      positions,
    ) !==
    JSON.stringify(
      expectedPositions,
    )
  ) {
    errors.push(
      "Node positions must be unique, contiguous, and start at 0.",
    );
  }

  const seenPositions =
    new Set<number>();

  for (
    const node of nodes
  ) {
    if (
      !node ||
      typeof node !== "object"
    ) {
      errors.push(
        "Every workflow node must be an object.",
      );

      continue;
    }

    const nodeRecord =
      node as Record<
        string,
        unknown
      >;

    if (
      typeof nodeRecord.position !==
      "number"
    ) {
      errors.push(
        "Every workflow node must have a numeric position.",
      );
    } else {
      if (
        seenPositions.has(
          nodeRecord.position,
        )
      ) {
        errors.push(
          `Duplicate node position: ${nodeRecord.position}.`,
        );
      }

      seenPositions.add(
        nodeRecord.position,
      );
    }

    if (
      typeof nodeRecord.type !==
      "string"
    ) {
      errors.push(
        "Every workflow node must have a string type.",
      );
    }

    if (
      typeof nodeRecord.title !==
      "string"
    ) {
      errors.push(
        "Every workflow node must have a string title.",
      );
    }

    if (
      !nodeRecord.config ||
      typeof nodeRecord.config !== "object" ||
      Array.isArray(
        nodeRecord.config,
      )
    ) {
      errors.push(
        "Every workflow node must have a config object.",
      );
    }
  }

  const triggerNodes =
    nodes.filter(
      (node) =>
        node &&
        typeof node === "object" &&
        (
          node as Record<
            string,
            unknown
          >
        ).type ===
          "trigger",
    );

  if (
    triggerNodes.length !==
    1
  ) {
    errors.push(
      "Workflow must contain exactly one trigger node.",
    );
  } else {
    const trigger =
      triggerNodes[0] as Record<
        string,
        unknown
      >;

    if (
      trigger.position !==
      0
    ) {
      errors.push(
        "Trigger node must be at position 0.",
      );
    }
  }

  const endNodes =
    nodes.filter(
      (node) =>
        node &&
        typeof node === "object" &&
        (
          node as Record<
            string,
            unknown
          >
        ).type ===
          "end",
    );

  if (
    endNodes.length !==
    1
  ) {
    errors.push(
      "Workflow must contain exactly one end node.",
    );
  } else {
    const end =
      endNodes[0] as Record<
        string,
        unknown
      >;

    const highestPosition =
      nodes.length - 1;

    if (
      end.position !==
      highestPosition
    ) {
      errors.push(
        `End node must be at the final position ${highestPosition}.`,
      );
    }
  }

  /*
   * Validate edges structurally.
   */
  if (
    Array.isArray(edges)
  ) {
    const validPositions =
      new Set(
        positions.filter(
          (
            value,
          ): value is number =>
            typeof value ===
            "number",
        ),
      );

    for (
      const edge of edges
    ) {
      if (
        !edge ||
        typeof edge !== "object"
      ) {
        errors.push(
          "Every workflow edge must be an object.",
        );

        continue;
      }

      const edgeRecord =
        edge as Record<
          string,
          unknown
        >;

      if (
        typeof edgeRecord.source !==
        "number"
      ) {
        errors.push(
          "Every workflow edge must have a numeric source.",
        );
      } else if (
        !validPositions.has(
          edgeRecord.source,
        )
      ) {
        errors.push(
          `Edge source ${String(
            edgeRecord.source,
          )} does not reference an existing node.`,
        );
      }

      if (
        typeof edgeRecord.target !==
        "number"
      ) {
        errors.push(
          "Every workflow edge must have a numeric target.",
        );
      } else if (
        !validPositions.has(
          edgeRecord.target,
        )
      ) {
        errors.push(
          `Edge target ${String(
            edgeRecord.target,
          )} does not reference an existing node.`,
        );
      }
    }
  }

  /*
   * Basic execution-chain validation.
   *
   * We do not require literally one edge per pair because the system
   * supports branching/control-flow nodes.
   */
  if (
    Array.isArray(edges)
  ) {
    const incoming =
      new Map<number, number>();

    const outgoing =
      new Map<number, number>();

    for (
      const edge of edges
    ) {
      if (
        !edge ||
        typeof edge !== "object"
      ) {
        continue;
      }

      const edgeRecord =
        edge as Record<
          string,
          unknown
        >;

      const source =
        edgeRecord.source;

      const target =
        edgeRecord.target;

      if (
        typeof source !==
          "number" ||
        typeof target !==
          "number"
      ) {
        continue;
      }

      outgoing.set(
        source,
        (outgoing.get(
          source,
        ) ?? 0) + 1,
      );

      incoming.set(
        target,
        (incoming.get(
          target,
        ) ?? 0) + 1,
      );
    }

    /*
     * Start should have outgoing work.
     */
    if (
      nodes.length > 1 &&
      !outgoing.has(0)
    ) {
      errors.push(
        "Trigger node has no outgoing edge.",
      );
    }

    /*
     * End should have no outgoing edge.
     */
    if (
      nodes.length > 0 &&
      outgoing.has(
        nodes.length - 1,
      )
    ) {
      errors.push(
        "End node must not have an outgoing edge.",
      );
    }

    /*
     * Every non-trigger node should normally have an incoming edge.
     *
     * A control-flow graph can be more complex, but a completely
     * disconnected node is always invalid.
     */
    for (
      const node of nodes
    ) {
      if (
        !node ||
        typeof node !== "object"
      ) {
        continue;
      }

      const position =
        (
          node as Record<
            string,
            unknown
          >
        ).position;

      const type =
        (
          node as Record<
            string,
            unknown
          >
        ).type;

      if (
        typeof position !==
        "number"
      ) {
        continue;
      }

      if (
        position === 0
      ) {
        continue;
      }

      if (
        !incoming.has(
          position,
        )
      ) {
        errors.push(
          `Node at position ${position} (${String(
            type,
          )}) has no incoming edge.`,
        );
      }
    }
  }

  return [
    ...new Set(
      errors,
    ),
  ];
}

/*
 * ============================================================
 * 23. MODEL REQUEST / RETRIES
 * ============================================================
 */

export async function askForValidReply(
  prompt: string,
  browser: Browser,
  maxRetries: number,
  systemOverview: string,
  context: AgentContext,
  previousReply:
    | AgentReply
    | null = null,
): Promise<AgentReply> {
  let lastRawResponse =
    "";

  let lastError =
    "";

  for (
    let attempt = 0;
    attempt <= maxRetries;
    attempt++
  ) {
    assertBrowserConnected(
      browser,
    );

    log(
      `Model request attempt ${attempt + 1}/${maxRetries + 1}.`,
    );

    let currentPrompt =
      prompt;

    if (
      attempt > 0
    ) {
      const reason =
        lastRawResponse &&
        looksLikePluginUILeak(
          lastRawResponse,
        )
          ? "plugin_leak"
          : "schema_error";

      currentPrompt =
        createCorrectivePrompt(
          context.userPrompt,
          context,
          reason,
          lastError ||
            "Previous model response could not be accepted.",
          previousReply,
        );
    }

    try {
      const rawResponse =
        await askChatGPT(
          currentPrompt,
          browser,
        );

      lastRawResponse =
        rawResponse;

      console.log(
        "RAW RESPONSE:",
        rawResponse,
      );

      /*
       * Parse JSON before considering surrounding ChatGPT UI text.
       */
      const parsed =
        parseAgentReply(
          rawResponse,
        );

      return parsed;
    } catch (error) {
      lastError =
        getErrorMessage(
          error,
        );

      logError(
        `Model request attempt ${attempt + 1} failed.`,
        error,
      );

      if (
        isBrowserClosedError(
          error,
        ) ||
        !browser.isConnected()
      ) {
        logError(
          "Browser/context is closed. Aborting model retries.",
        );

        throw error;
      }

      if (
        attempt ===
        maxRetries
      ) {
        throw error;
      }

      logWarn(
        `Will retry model request. Remaining retries: ${
          maxRetries - attempt
        }`,
      );
    }
  }

  throw new Error(
    "Failed to obtain a valid agent reply.",
  );
}

/*
 * ============================================================
 * 24. AGENT REPLY MERGING
 * ============================================================
 */

function mergeAgentReplies(
  previous:
    | AgentReply
    | null,
  next: AgentReply,
): AgentReply {
  if (!previous) {
    return next;
  }

  const nextResult =
    next.result;

  const hasMeaningfulResult =
    nextResult &&
    typeof nextResult === "object" &&
    Object.keys(
      nextResult,
    ).length > 0;

  const result =
    hasMeaningfulResult
      ? nextResult
      : previous.result;

  return {
    ...next,
    result,
  };
}

/*
 * ============================================================
 * 25. MAIN AGENT
 * ============================================================
 */

export async function runChatGPTAgent(
  prompt: string,
  options: AgentConfig = {},
): Promise<AgentReply> {
  const {
    maxRounds = 20,
    maxRetries = 2,
    headless = false,
  } = options;

  const startedAt =
    Date.now();

  log(
    "============================================================",
  );

  log(
    "STARTING AGENT RUN",
  );

  log(
    "Agent configuration:",
    {
      maxRounds,
      maxRetries,
      headless,
    },
  );

  log(
    "User prompt:",
    prompt,
  );

  /*
   * ----------------------------------------------------------
   * LOAD SYSTEM OVERVIEW BEFORE ANY MODEL REQUEST
   * ----------------------------------------------------------
   */

  const systemOverview =
    await loadSystemOverview();

  /*
   * ----------------------------------------------------------
   * BROWSER
   * ----------------------------------------------------------
   */

  const browser =
    await chromium.launch({
      headless,
    });

  log(
    "Playwright browser launched successfully.",
  );

  let latestReply:
    | AgentReply
    | null =
    null;

  const context:
    AgentContext =
    {
      userPrompt:
        prompt,

      result: {},

      toolResults: [],

      loadedSystemFiles:
        new Set<string>(),

      loadedSystemFileContents:
        new Map<string, string>(),

      discoveredPages:
        new Map<string, DiscoveredPage>(),

      systemOverview,

      recentRoundSignatures:
        [],

      repeatedToolCalls:
        new Map<
          string,
          number
        >(),

      toolCallHistory:
        [],

      emptyRounds:
        0,

      currentRound:
        0,
    };

  try {
    /*
     * --------------------------------------------------------
     * INITIAL PROMPT
     * --------------------------------------------------------
     */

    let currentPrompt =
      createInitialPrompt(
        prompt,
        systemOverview,
      );

    /*
     * --------------------------------------------------------
     * AGENT LOOP
     * --------------------------------------------------------
     */

    for (
      let round = 0;
      round < maxRounds;
      round++
    ) {
      context.currentRound =
        round + 1;

      log(
        "------------------------------------------------------------",
      );

      log(
        `ROUND ${round + 1}/${maxRounds}`,
      );

      assertBrowserConnected(
        browser,
      );

      /*
       * ------------------------------------------------------
       * ASK MODEL
       * ------------------------------------------------------
       */

      const reply =
        await askForValidReply(
          currentPrompt,
          browser,
          maxRetries,
          systemOverview,
          context,
          latestReply,
        );

      log(
        `Round ${round + 1}: model reply received.`,
        {
          done:
            reply.done,
          toolCalls:
            reply.toolCalls.length,
          answer:
            reply.answer,
          result:
            summarizeText(
              stringifySafe(
                reply.result,
              ),
              1500,
            ),
        },
      );

      /*
       * ------------------------------------------------------
       * MERGE
       * ------------------------------------------------------
       */

      latestReply =
        mergeAgentReplies(
          latestReply,
          reply,
        );

      context.result =
        latestReply.result;

      /*
       * ------------------------------------------------------
       * VALIDATE TOOL CALLS
       * ------------------------------------------------------
       */

      const toolValidation =
        validateToolCalls(
          reply.toolCalls,
          context.loadedSystemFiles,
          new Set(
            context.discoveredPages.keys(),
          ),
        );

      const toolCalls =
        toolValidation.validCalls;

      /*
       * ------------------------------------------------------
       * INVALID TOOL CALL HANDLING
       * ------------------------------------------------------
       *
       * CRITICAL:
       *
       * Do NOT silently discard invalid planning directives.
       *
       * Example:
       *
       * model -> click
       * runner -> "click must be a workflow node"
       * model -> fixes result.nodes
       *
       * This prevents the fetch-page/click/fetch-page loop.
       *
       * As of this revision, this branch also catches
       * already-fetched-URL rejections from validateToolCalls,
       * using the "no_progress" corrective (rather than
       * "schema_error") since the JSON shape was fine - the
       * model just tried to redo already-completed discovery.
       */

      if (
        toolValidation.errors.length > 0
      ) {
        logWarn(
          `Round ${round + 1}: invalid planning directives detected.`,
          toolValidation.errors,
        );

        const isRepeatUrlOnly =
          toolValidation.errors.every(
            (message) =>
              message.startsWith(
                "URL already fetched successfully",
              ),
          );

        context.emptyRounds = 0;

        currentPrompt =
          createCorrectivePrompt(
            prompt,
            context,
            isRepeatUrlOnly
              ? "no_progress"
              : "schema_error",
            [
              "The previous response contained invalid planning directives.",
              "",
              ...toolValidation.errors,
              "",
              "Only call_system_files and fetch_page may appear in toolCalls.",
              "Workflow nodes such as click, fill, goto, wait_for_element, extract_text, telegram, and end must be inside result.nodes.",
              "",
              "Do not repeat already completed discovery.",
              "Correct the response using the information already discovered.",
            ].join("\n"),
            latestReply,
          );

        continue;
      }

      /*
       * ------------------------------------------------------
       * DONE
       * ------------------------------------------------------
       *
       * A done:true response is accepted ONLY when:
       *
       * 1. There are no tool calls.
       * 2. The workflow structure is valid.
       */

      if (
        reply.done &&
        toolCalls.length ===
          0
      ) {
        const workflowErrors =
          validateWorkflowResult(
            context.result,
          );

        if (
          workflowErrors.length > 0
        ) {
          logWarn(
            `Round ${round + 1}: model marked workflow complete, but workflow validation failed.`,
            workflowErrors,
          );

          context.emptyRounds =
            0;

          currentPrompt =
            createCorrectivePrompt(
              prompt,
              context,
              "schema_error",
              [
                "The model marked the workflow done, but structural validation failed.",
                "",
                ...workflowErrors,
                "",
                "Fix the workflow inside result.nodes/result.edges.",
                "Do not execute the workflow.",
                "Return done:true only after the workflow is structurally valid.",
              ].join("\n"),
              latestReply,
            );

          continue;
        }

        log(
          `Round ${round + 1}: agent marked task as DONE.`,
        );

        return {
          ...latestReply,
          toolCalls: [],
          done: true,
          result:
            context.result,
        };
      }

      /*
       * ------------------------------------------------------
       * DONE + TOOL CALLS
       * ------------------------------------------------------
       *
       * A finished workflow cannot simultaneously request more
       * planning directives.
       */

      if (
        reply.done &&
        toolCalls.length >
          0
      ) {
        logWarn(
          `Round ${round + 1}: agent marked done but also returned tool calls. Requesting clean completion.`,
        );


        currentPrompt =
          createCorrectivePrompt(
            prompt,
            context,
            "schema_error",
            [
              "The response marked done=true but also contained tool calls.",
              "Return a clean final workflow.",
              "When complete, use done=true with toolCalls=[] and result containing the workflow.",
            ].join("\n"),
            latestReply,
          );

        continue;
      }

      /*
       * ------------------------------------------------------
       * NO TOOL CALLS
       * ------------------------------------------------------
       */

      if (
        toolCalls.length ===
        0
      ) {
        context.emptyRounds++;

        logWarn(
          `Round ${round + 1}: agent neither finished nor requested a valid discovery directive.`,
          {
            emptyRounds:
              context.emptyRounds,
          },
        );

        if (
          context.emptyRounds >=
          MAX_EMPTY_ROUNDS
        ) {
          throw new Error(
            "Agent stopped because it failed to make meaningful progress for multiple consecutive rounds.",
          );
        }


        currentPrompt =
          createContinuationPrompt(
            context,
            latestReply,
          );

        continue;
      }

      /*
       * ------------------------------------------------------
       * EXECUTE TOOLS
       * ------------------------------------------------------
       */

      const toolResults =
        await executeToolCalls(
          toolCalls,
          browser,
          context,
        );

      /*
       * ------------------------------------------------------
       * TRACK SYSTEM FILES
       * ------------------------------------------------------
       */

      for (
        const toolResult of
          toolResults
      ) {
        if (
          toolResult.name !==
          "call_system_files"
        ) {
          continue;
        }

        let parsedOutput:
          unknown =
          toolResult.output;

        try {
          parsedOutput =
            JSON.parse(
              toolResult.output,
            );
        } catch {
          /*
           * Leave serialized output untouched if it cannot be parsed.
           */
        }

        trackSuccessfullyLoadedSystemFiles(
          context,
          parsedOutput,
        );
      }

      /*
       * ------------------------------------------------------
       * TRACK FETCHED PAGES (accumulated, never overwritten)
       * ------------------------------------------------------
       */

      trackFetchedPages(
        context,
        toolResults,
        round + 1,
      );

      /*
       * ------------------------------------------------------
       * STORE TOOL RESULTS
       * ------------------------------------------------------
       */

      context.toolResults =
        toolResults;

      /*
       * ------------------------------------------------------
       * PRESERVE RESULT
       * ------------------------------------------------------
       */

      context.result =
        latestReply.result;

      /*
       * ------------------------------------------------------
       * CONTINUE
       * ------------------------------------------------------
       */

      currentPrompt =
        createContinuationPrompt(
          context,
          latestReply,
        );
    }

    /*
     * --------------------------------------------------------
     * MAX ROUNDS
     * --------------------------------------------------------
     */

    logWarn(
      `Maximum rounds reached: ${maxRounds}.`,
    );

    if (
      latestReply
    ) {
      return {
        ...latestReply,
        answer:
          latestReply.answer ||
          "I reached the maximum number of agent rounds before completing the task.",
        done: false,
        toolCalls: [],
        result:
          context.result,
      };
    }

    return {
      answer:
        "The agent could not complete the task.",
      toolCalls: [],
      result: {},
      done: false,
    };
  } catch (error) {
    /*
     * --------------------------------------------------------
     * FAILURE
     * --------------------------------------------------------
     */

    logError(
      "AGENT RUN FAILED.",
      error,
    );

    logError(
      "Failure context:",
      {
        userPrompt:
          context.userPrompt,
        currentResult:
          context.result,
        latestReply,
        loadedSystemFiles:
          [
            ...context.loadedSystemFiles,
          ],
        discoveredPageUrls:
          [
            ...context.discoveredPages.keys(),
          ],
        toolResults:
          context.toolResults,
        emptyRounds:
          context.emptyRounds,
      },
    );

    if (
      latestReply
    ) {
      return {
        ...latestReply,
        answer:
          latestReply.answer ||
          getErrorMessage(
            error,
          ),
        toolCalls: [],
        done: false,
        result:
          context.result,
      };
    }

    return {
      answer:
        getErrorMessage(
          error,
        ),
      toolCalls: [],
      result: {},
      done: false,
    };
  } finally {
    /*
     * --------------------------------------------------------
     * CLOSE BROWSER
     * --------------------------------------------------------
     */

    log(
      "Closing Playwright browser...",
    );

    try {
      if (
        browser.isConnected()
      ) {
        await browser.close();

        log(
          `Playwright browser closed successfully. Total runtime: ${
            Date.now() -
            startedAt
          }ms`,
        );
      } else {
        logWarn(
          "Playwright browser was already disconnected.",
        );
      }
    } catch (error) {
      logError(
        "Failed to close Playwright browser.",
        error,
      );
    }

    log(
      "============================================================",
    );
  }
}