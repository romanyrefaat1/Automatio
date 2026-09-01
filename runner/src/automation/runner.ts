import { Browser, Page } from "@playwright/test";
import { dispatcher } from "./dispatcher";
import condition from "./nodes/condition";

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

  // Stores how many times each loop has run
  const loopState = new Map<string, number>();

  while (currentNodeId) {
    const currentNode = workflowArray.find(
      (node) => node.id === currentNodeId
    );

    if (!currentNode) {
      throw new Error(`Node ${currentNodeId} not found`);
    }

    console.log(
      `Running node ${currentNode.id}: ${currentNode.type}`
    );

    /*
     * LOOP
     *
     * A loop does not get handled by the normal dispatcher.
     * The runner controls the loop because the runner controls
     * navigation.
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

        const doneEdge = workflowEdges.find(
          (edge) =>
            edge.source === currentNode.id &&
            edge.sourceHandle === "done"
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
      const conditionResponse = await condition(
        currentNode.config.condition,
        page
      );

      console.log(
        `Loop ${currentNode.id} condition:`,
        conditionResponse
      );

      if (!conditionResponse.success) {
        console.error(
          "Loop condition failed:",
          conditionResponse.error
        );

        break;
      }

      /*
       * Condition is FALSE → loop is finished
       */
      if (!conditionResponse.data) {
        console.log(
          `Loop ${currentNode.id} condition is false`
        );

        loopState.delete(currentNode.id);

        const doneEdge = workflowEdges.find(
          (edge) =>
            edge.source === currentNode.id &&
            edge.sourceHandle === "done"
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
       * Condition is TRUE → run loop body
       */
      const nextIteration = currentIteration + 1;

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

      const bodyEdge = workflowEdges.find(
        (edge) =>
          edge.source === currentNode.id &&
          edge.sourceHandle === "body"
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
     * NORMAL NODE
     */
    const response = await dispatcher(
      currentNode,
      browser,
      page
    );

    console.log("Response:", response);

    /*
     * Node failed
     */
    if (!response.success) {
      console.error(
        "Node failed:",
        response.error
      );

      break;
    }

    /*
     * Find outgoing edges
     */
    const outgoingEdges = workflowEdges.filter(
      (edge) => edge.source === currentNode.id
    );

    /*
     * No outgoing edge = workflow finished
     */
    if (outgoingEdges.length === 0) {
      console.log(
        `Node ${currentNode.id} has no outgoing edges. Workflow finished.`
      );

      break;
    }

    /*
     * CONDITION
     */
    if (currentNode.type === "condition") {
      const handle = response.data
        ? "true"
        : "false";

      const edge = outgoingEdges.find(
        (edge) =>
          edge.sourceHandle === handle
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
     * NORMAL NODE
     *
     * Normal nodes simply follow their
     * outgoing edge.
     */
    currentNodeId = outgoingEdges[0].target;
  }

  await browser.close();
}