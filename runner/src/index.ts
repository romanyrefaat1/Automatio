import { createServer } from "node:http";
import { automationIndex } from "./automation";

const server = createServer(async (req, res) => {
  if (req.method === "POST" && req.url === "/workflow") {
    try {
      let body = "";

      for await (const chunk of req) {
        body += chunk;
      }

      const { workflowArray, workflowEdges } = JSON.parse(body);

      if (!Array.isArray(workflowArray)) {
        res.writeHead(400, {
          "Content-Type": "application/json",
        });

        res.end(
          JSON.stringify({
            success: false,
            error: "workflowArray must be an array",
          })
        );

        return;
      }

      if (!Array.isArray(workflowEdges)) {
        res.writeHead(400, {
          "Content-Type": "application/json",
        });

        res.end(
          JSON.stringify({
            success: false,
            error: "workflowEdges must be an array",
          })
        );

        return;
      }

      await automationIndex(
        workflowArray,
        workflowEdges
      );

      res.writeHead(200, {
        "Content-Type": "application/json",
      });

      res.end(
        JSON.stringify({
          success: true,
        })
      );
    } catch (error) {
      console.error(error);

      res.writeHead(500, {
        "Content-Type": "application/json",
      });

      res.end(
        JSON.stringify({
          success: false,
          error:
            error instanceof Error
              ? error.message
              : "Workflow execution failed",
        })
      );
    }

    return;
  }

  if (req.method === "GET" && req.url === "/health") {
    res.writeHead(200, {
      "Content-Type": "application/json",
    });

    res.end(
      JSON.stringify({
        status: "ok",
      })
    );

    return;
  }

  res.writeHead(404, {
    "Content-Type": "application/json",
  });

  res.end(
    JSON.stringify({
      error: "Not found",
    })
  );
});

const port = Number(process.env.PORT) || 3000;

server.listen(port, "0.0.0.0", () => {
  console.log(`Runner listening on port ${port}`);
});