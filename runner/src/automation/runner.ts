import { Browser, Page } from "@playwright/test";

import { dispatcher } from "./dispatcher";
import condition from "./nodes/condition";

import interpolate from "./nodes/helper/interpolate";

import type { WorkflowVariables } from "./nodes/helper/variables";

function getNode(
  workflowArray: any[],
  nodeId: string
) {
  const node = workflowArray.find(
    (node) => node.id === nodeId
  );

  if (!node) {
    throw new Error(`Node ${nodeId} not found`);
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
    throw new Error("Empty workflowArray");
  }

  let currentNodeId = workflowArray[0].id;

  /*
   * Keeps track of loop iterations.
   *
   * Example:
   *
   * loopState
   * ├── loop-1 → 3
   * └── loop-2 → 7
   */
  const loopState = new Map<string, number>();

  /*
   * Stores values produced by the workflow.
   *
   * Example:
   *
   * variables
   * ├── username → "Romany"
   * ├── page_title → "Dashboard"
   * └── status → "success"
   */
  const variables: WorkflowVariables = new Map();

  while (currentNodeId) {
    const currentNode = getNode(
      workflowArray,
      currentNodeId
    );

    console.log(
      `Running node ${currentNode.id}: ${currentNode.type}`
    );

    /*
     * =========================
     * LOOP
     * =========================
     */

    if (currentNode.type === "loop") {
      const currentIteration =
        loopState.get(currentNode.id) ?? 0;

      const maxIterations =
        currentNode.config.max_iterations;

      /*
       * Safety limit
       */

      if (
        maxIterations !== undefined &&
        currentIteration >= maxIterations
      ) {
        console.log(
          `Loop ${currentNode.id} reached max iterations (${maxIterations})`
        );

        loopState.delete(currentNode.id);

        const doneEdge = getEdgeByHandle(
          workflowEdges,
          currentNode.id,
          "done"
        );

        if (!doneEdge) {
          throw new Error(
            `Loop ${currentNode.id} has no done edge`
          );
        }

        currentNodeId = doneEdge.target;

        continue;
      }

      /*
       * Evaluate loop condition
       */

      const loopCondition =
        interpolate(
          currentNode.config.condition,
          variables
        );

      const conditionResponse =
        await condition(
          loopCondition,
          page
        );

      console.log(
        `Loop ${currentNode.id} condition:`,
        conditionResponse
      );

      if (!conditionResponse.success) {
        throw new Error(
          `Loop ${currentNode.id} condition failed`
        );
      }

      /*
       * Condition is false
       * → leave the loop
       */

      if (!conditionResponse.data) {
        console.log(
          `Loop ${currentNode.id} condition is false`
        );

        loopState.delete(currentNode.id);

        const doneEdge = getEdgeByHandle(
          workflowEdges,
          currentNode.id,
          "done"
        );

        if (!doneEdge) {
          throw new Error(
            `Loop ${currentNode.id} has no done edge`
          );
        }

        currentNodeId = doneEdge.target;

        continue;
      }

      /*
       * Condition is true
       * → enter loop body
       */

      const nextIteration =
        currentIteration + 1;

      loopState.set(
        currentNode.id,
        nextIteration
      );

      console.log(
        `Loop ${currentNode.id}: iteration ${nextIteration}${
          maxIterations !== undefined
            ? `/${maxIterations}`
            : ""
        }`
      );

      const bodyEdge = getEdgeByHandle(
        workflowEdges,
        currentNode.id,
        "body"
      );

      if (!bodyEdge) {
        throw new Error(
          `Loop ${currentNode.id} has no body edge`
        );
      }

      currentNodeId = bodyEdge.target;

      continue;
    }

    /*
     * =========================
     * INTERPOLATE VARIABLES
     * =========================
     *
     * Example:
     *
     * {
     *   expected: "{{username}}"
     * }
     *
     * becomes:
     *
     * {
     *   expected: "Romany"
     * }
     */

    const resolvedConfig = interpolate(
      currentNode.config,
      variables
    );

    const nodeToRun = {
      ...currentNode,
      config: resolvedConfig,
    };

    /*
     * =========================
     * DISPATCH NODE
     * =========================
     */

    const response = await dispatcher(
      nodeToRun,
      browser,
      page
    );

    console.log(
      "Response:",
      response
    );

    /*
     * =========================
     * SAVE VARIABLES
     * =========================
     *
     * Currently extract_text
     * can save its result.
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
     * =========================
     * NODE FAILURE
     * =========================
     */

    if (!response.success) {
      throw new Error(
        `Node ${currentNode.id} failed`
      );
    }

    /*
     * =========================
     * OUTGOING EDGES
     * =========================
     */

    const outgoingEdges =
      getOutgoingEdges(
        workflowEdges,
        currentNode.id
      );

    /*
     * No outgoing edges
     * → workflow finished
     */

    if (outgoingEdges.length === 0) {
      console.log(
        `Node ${currentNode.id} has no outgoing edges. Workflow finished.`
      );

      break;
    }

    /*
     * =========================
     * CONDITION
     * =========================
     */

    if (currentNode.type === "condition") {
      const handle = response.data
        ? "true"
        : "false";

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
     * =========================
     * NORMAL NEXT NODE
     * =========================
     */

    currentNodeId =
      outgoingEdges[0].target;
  }
}