import { Browser, Page } from "@playwright/test";

import { dispatcher } from "./dispatcher";
import condition from "./nodes/condition";
import parallel from "./nodes/parallel";
import interpolate from "./nodes/helper/interpolate";
import type { WorkflowVariables } from "./nodes/helper/variables";
import { supabase } from "../supabase/supabase";
import { config } from "dotenv";
import { decryptSecret } from "./nodes/helper/telegram/telegram-security";
import telegram from "./nodes/telegram";
import { end } from "./nodes/end";

function getNode(
  workflowArray: any[],
  nodeId: string
) {
  const node = workflowArray.find(
    (node) => node.id === nodeId
  );

  if (!node) {
    throw new Error(
      `Node ${nodeId} not found`
    );
  }

  return node;
}

function getOutgoingEdges(
  workflowEdges: any[],
  nodeId: string
) {
  return workflowEdges.filter(
    (edge) => edge.source === nodeId
  );
}

function getEdgeByHandle(
  workflowEdges: any[],
  nodeId: string,
  handle: string
) {
  return workflowEdges.find(
    (edge) =>
      edge.source === nodeId &&
      edge.sourceHandle === handle
  );
}

export default async function runner(
  workflowArray: any[],
  workflowEdges: any[],
  browser: Browser,
  page: Page
) {
  if (workflowArray.length === 0) {
    throw new Error(
      "Empty workflowArray"
    );
  }

  let currentNodeId =
    workflowArray[0].id;

  const loopState =
    new Map<string, number>();

  /*
   * Stack of loop node IDs we are currently
   * inside. When the body branch has no more
   * outgoing edges, we jump back to the top
   * of this stack (the nearest enclosing loop)
   * instead of finishing the workflow.
   */
  const loopStack: string[] = [];

  const variables: WorkflowVariables =
    new Map();

  while (currentNodeId) {
  const currentNode = getNode(
    workflowArray,
    currentNodeId
  );

  console.log(
    `Running node ${currentNode.id}: ${currentNode.type}`
  );

  if (currentNode.type === "trigger") {
    console.log("Skipping trigger node");

    const outgoingEdges = getOutgoingEdges(
      workflowEdges,
      currentNode.id
    );

    if (outgoingEdges.length === 0) {
      console.log(
        `Trigger ${currentNode.id} has no outgoing edges. Workflow finished.`
      );

      break;
    }

    currentNodeId = outgoingEdges[0].target;

    continue;
  }

  if (currentNode.type === "end") {
    console.log(`End node ${currentNode.id} reached. Workflow finished.`);
    await end(browser);
    break;
  }

    /*
     * ========================================
     * PARALLEL
     * ========================================
     */

    if (
      currentNode.type ===
      "parallel"
    ) {
      const parallelResult =
        await parallel(
          workflowArray,
          workflowEdges,
          currentNode.id,
          browser,
          variables,
          currentNode.data.config
        );

      /*
       * The parallel node returns the common
       * join node. The main runner continues
       * from there only after every branch
       * has completed.
       */
      currentNodeId =
        parallelResult.joinNodeId;

      continue;
    }

    /*
     * ========================================
     * LOOP
     * ========================================
     */

    if (
      currentNode.type ===
      "loop"
    ) {
      const currentIteration =
        loopState.get(
          currentNode.id
        ) ?? 0;

      const maxIterations =
        currentNode.data.config
          .max_iterations;

      /*
       * Maximum iteration limit reached.
       */
      if (
        maxIterations !==
          undefined &&
        currentIteration >=
          maxIterations
      ) {
        console.log(
          `Loop ${currentNode.id} reached max iterations (${maxIterations})`
        );

        loopState.delete(
          currentNode.id
        );

        /*
         * We're leaving this loop — remove it
         * from the stack so body-end detection
         * doesn't jump back into a finished loop.
         */
        const exitIdx = loopStack.lastIndexOf(currentNode.id);
        if (exitIdx !== -1) loopStack.splice(exitIdx, 1);

        const doneEdge =
          getEdgeByHandle(
            workflowEdges,
            currentNode.id,
            "done"
          );

        if (!doneEdge) {
          console.log(
            `Loop ${currentNode.id} reached max iterations with no outgoing done edge. Workflow finished.`
          );

          break;
        }

        currentNodeId =
          doneEdge.target;

        continue;
      }

      /*
 * Resolve loop condition.
 */
const loopCondition =
  currentNode.data.config.condition;

const conditionResponse =
  await condition(
    loopCondition,
    page,
    variables
  );

console.log(
  `Loop ${currentNode.id} condition config:`,
  loopCondition
);

console.log(
  `Loop ${currentNode.id} condition result:`,
  conditionResponse
);

if (!conditionResponse.success) {
  throw new Error(
    `Loop ${currentNode.id} condition failed: ${
      conditionResponse.error instanceof Error
        ? conditionResponse.error.message
        : String(conditionResponse.error)
    }`
  );
}

      /*
       * Condition is false → leave loop.
       */
      if (
        !conditionResponse.data
      ) {
        console.log(
          `Loop ${currentNode.id} condition is false`
        );

        loopState.delete(
          currentNode.id
        );

        /*
         * We're leaving this loop — remove it
         * from the stack so body-end detection
         * doesn't jump back into a finished loop.
         */
        const exitIdx = loopStack.lastIndexOf(currentNode.id);
        if (exitIdx !== -1) loopStack.splice(exitIdx, 1);

        const doneEdge =
          getEdgeByHandle(
            workflowEdges,
            currentNode.id,
            "done"
          );

        if (!doneEdge) {
          console.log(
            `Loop ${currentNode.id} condition is false with no outgoing done edge. Workflow finished.`
          );

          break;
        }

        currentNodeId =
          doneEdge.target;

        continue;
      }

      /*
       * Condition is true → enter body.
       */
      const nextIteration =
        currentIteration + 1;

      loopState.set(
        currentNode.id,
        nextIteration
      );

      console.log(
        `Loop ${currentNode.id}: iteration ${nextIteration}${
          maxIterations !==
          undefined
            ? `/${maxIterations}`
            : ""
        }`
      );

      const bodyEdge =
        getEdgeByHandle(
          workflowEdges,
          currentNode.id,
          "body"
        );

      if (!bodyEdge) {
        throw new Error(
          `Loop ${currentNode.id} has no body edge`
        );
      }

      /*
       * Push this loop node onto the stack so
       * that when the body branch runs out of
       * outgoing edges it returns here instead
       * of finishing the workflow.
       */
      loopStack.push(currentNode.id);

      currentNodeId =
        bodyEdge.target;

      continue;
    }

  /*
 * ========================================
 * CONDITION
 * ========================================
 */

if (currentNode.type === "condition") {
  const response = await condition(
    currentNode.data.config,
    page,
    variables
  );

  console.log(
    "Condition config:",
    currentNode.data.config
  );

  console.log(
    "Condition response:",
    response
  );

  if (!response.success) {
    throw new Error(
      `Condition node ${currentNode.id} failed: ${
        response.error instanceof Error
          ? response.error.message
          : String(response.error)
      }`
    );
  }

  const handle =
    response.data
      ? "true"
      : "false";

      console.log(
  "Condition node:",
  currentNode.id
);

console.log(
  "Expected handle:",
  handle
);

console.log(
  "Outgoing condition edges:",
  workflowEdges.filter(
    (edge) =>
      edge.source === currentNode.id
  )
);

  const edge = getEdgeByHandle(
    workflowEdges,
    currentNode.id,
    handle
  );

  if (!edge) {
    throw new Error(
      `Condition node ${currentNode.id} has no ${handle} branch`
    );
  }

  console.log(
    `Condition ${currentNode.id}: ${handle}`
  );

  currentNodeId = edge.target;

  continue;
}

    /*
     * ========================================
     * Telegram NODE
     * ========================================
     */

    if (currentNode.type === "telegram") {
  console.log("Telegram from runner", currentNode);

  const telegramConfig = currentNode.data.config;
  const integrationId = telegramConfig.integration_id;

  if (!integrationId) {
    throw new Error(
      `Telegram node ${currentNode.id} is missing integration_id`
    );
  }

  const { data: integration, error } = await supabase
    .from("integrations")
    .select("id, type, name, config, secret")
    .eq("id", integrationId)
    .single();

  if (error) {
    throw new Error(
      `Failed to load Telegram integration: ${error.message}`
    );
  }

  if (!integration) {
    throw new Error(
      `Telegram integration ${integrationId} not found`
    );
  }

  if (integration.type !== "telegram") {
    throw new Error(
      `Integration ${integrationId} is not a Telegram integration`
    );
  }

  if (!integration.secret) {
    throw new Error(
      `Telegram integration ${integrationId} has no bot token`
    );
  }

  const chatId = integration.config?.chat_id;

  if (!chatId) {
    throw new Error(
      `Telegram integration ${integrationId} is missing chat_id`
    );
  }

  const botToken = decryptSecret(integration.secret);

  const resolvedConfig = interpolate(
    {
      ...telegramConfig,
      chat_id: chatId,
    },
    variables
  );

  const response = await telegram(
    resolvedConfig,
    botToken
  );

  console.log("Telegram response:", response);

  if (!response.success) {
    throw new Error(
      `Telegram node ${currentNode.id} failed`
    );
  }

  if (response.save_as) {
    variables.set(
      response.save_as,
      response.data
    );
  }

  const outgoingEdges = getOutgoingEdges(
    workflowEdges,
    currentNode.id
  );

  if (outgoingEdges.length === 0) {
    if (loopStack.length > 0) {
      const enclosingLoopId =
        loopStack[loopStack.length - 1];

      console.log(
        `Telegram node ${currentNode.id} body end → returning to loop ${enclosingLoopId}`
      );

      currentNodeId = enclosingLoopId;

      continue;
    }

    console.log(
      `Telegram node ${currentNode.id} has no outgoing edges. Workflow finished.`
    );

    break;
  }

  currentNodeId = outgoingEdges[0].target;

  continue;
}

    /*
     * ========================================
     * NORMAL NODE
     * ========================================
     */

    const resolvedConfig =
      interpolate(
        currentNode.data.config,
        variables
      );

      console.log("CurrentNode:", currentNode)
      console.log("CurrentConfig:", currentNode.data)
      console.log("ResolvedConfig:", resolvedConfig)

    const nodeToRun = {
      ...currentNode,
      config: resolvedConfig,
    };

    const response =
  await dispatcher(
    nodeToRun,
    browser,
    page,
    variables
  );

    console.log(
      "Response:",
      response
    );

    /*
     * Save the result into the main
     * workflow variable map.
     */
    if (
      response.success &&
      response.save_as
    ) {
      variables.set(
        response.save_as,
        response.data
      );

      console.log(
        `Variable "${response.save_as}" =`,
        response.data
      );
    }

    /*
     * Any failed node stops the workflow.
     */
    if (
      !response.success
    ) {
      throw new Error(
        `Node ${currentNode.id} failed`
      );
    }

    /*
     * Find the next node.
     */
    const outgoingEdges =
      getOutgoingEdges(
        workflowEdges,
        currentNode.id
      );

    if (
      outgoingEdges.length === 0
    ) {
      /*
       * If we're inside a loop body, jump back
       * to the nearest enclosing loop node so it
       * can re-evaluate its condition for the next
       * iteration.  No backward wire needed on the
       * canvas.
       */
      if (loopStack.length > 0) {
        const enclosingLoopId =
          loopStack[loopStack.length - 1];

        console.log(
          `Node ${currentNode.id} body end → returning to loop ${enclosingLoopId}`
        );

        currentNodeId = enclosingLoopId;

        continue;
      }

      console.log(
        `Node ${currentNode.id} has no outgoing edges. Workflow finished.`
      );

      break;
    }

    currentNodeId =
      outgoingEdges[0].target;
  }
}