import "dotenv/config";

import { createServer } from "node:http";

import { automationIndex } from "./automation";
import { runChatGPTAgent } from "./chatgpt/agent";

const RUNNER_SECRET = process.env.RUNNER_SECRET;

if (!RUNNER_SECRET) {
  throw new Error("RUNNER_SECRET is not set");
}

function sendJson(
  res: import("node:http").ServerResponse,
  status: number,
  body: unknown
) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization",
  });

  res.end(JSON.stringify(body));
}

async function readBody(
  req: import("node:http").IncomingMessage
) {
  let body = "";

  for await (const chunk of req) {
    body += chunk;
  }

  return JSON.parse(body);
}

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, null);
    return;
  }

  if (req.method === "POST" && req.url === "/agent") {
    try {
      const body = await readBody(req);

      const prompt = body?.prompt;
      const url = body?.url;
      const enableFetchPage =
        body?.fetchPage !== false;

      if (
        typeof prompt !== "string" ||
        !prompt.trim()
      ) {
        sendJson(res, 400, {
          success: false,
          error: "prompt is required",
        });

        return;
      }

      if (
        url !== undefined &&
        typeof url !== "string"
      ) {
        sendJson(res, 400, {
          success: false,
          error: "url must be a string",
        });

        return;
      }

      console.log(
        `ChatGPT agent request: ${prompt}`
      );

      const response = await runChatGPTAgent(
        prompt,
        {
          url,
          enableFetchPage,
          maxRounds: 6,
        }
      );

      /*
       * IMPORTANT:
       *
       * The frontend expects `answer`, `fetchUrls`, and `result`
       * as TOP-LEVEL fields on the JSON body (see AgentApiResponse
       * in AgentTab.tsx). Do not nest the agent's reply under a
       * `response` key here — that mismatch was previously causing
       * the frontend to read `data.answer` as undefined and fall
       * back to an empty string, so the agent's answer silently
       * never rendered even though the backend succeeded.
       */
      sendJson(res, 200, {
        success: true,
        answer: response.answer,
        fetchUrls: response.fetchUrls,
        result: response.result,
      });

      return;
    } catch (error) {
      console.error(
        "ChatGPT agent failed:",
        error
      );

      sendJson(res, 500, {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "ChatGPT agent failed",
      });

      return;
    }
  }

  if (
    req.method === "POST" &&
    req.url === "/workflow"
  ) {
    try {
      const authHeader = req.headers.authorization;

      if (
        !authHeader ||
        authHeader !== `Bearer ${RUNNER_SECRET}`
      ) {
        sendJson(res, 401, {
          success: false,
          error: "Unauthorized",
        });

        return;
      }

      const parsedBody = await readBody(req);

      const {
        automationId,
        runId,
      } = parsedBody;

      if (
        typeof automationId !== "string" ||
        automationId.length === 0
      ) {
        sendJson(res, 400, {
          success: false,
          error: "automationId is required",
        });

        return;
      }

      if (
        typeof runId !== "string" ||
        runId.length === 0
      ) {
        sendJson(res, 400, {
          success: false,
          error: "runId is required",
        });

        return;
      }

      console.log(
        `Received automation ${automationId}, run ${runId}`
      );

      void automationIndex(
        automationId,
        runId
      ).catch((error) => {
        console.error(
          "Background automation execution failed:",
          error
        );
      });

      sendJson(res, 202, {
        success: true,
        accepted: true,
        automationId,
        runId,
      });

      return;
    } catch (error) {
      console.error(error);

      sendJson(res, 500, {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Workflow execution failed",
      });

      return;
    }
  }

  if (req.method === "GET" && req.url === "/health") {
    sendJson(res, 200, {
      status: "ok",
    });

    return;
  }

  sendJson(res, 404, {
    error: "Not found",
  });
});

const port = Number(process.env.PORT) || 3000;

server.listen(port, "0.0.0.0", () => {
  console.log(
    `Runner listening on port ${port}`
  );
});