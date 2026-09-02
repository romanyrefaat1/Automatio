import "dotenv/config";

import { createServer } from "node:http";

import { automationIndex } from "./automation";

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
  });

  res.end(JSON.stringify(body));
}

const server = createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/workflow") {
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

      let body = "";

      for await (const chunk of req) {
        body += chunk;
      }

      const parsedBody = JSON.parse(body);

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

      /*
       * IMPORTANT:
       * Start the automation without waiting for it.
       *
       * This lets Supabase receive a fast HTTP response.
       */
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
  console.log(`Runner listening on port ${port}`);
});