import { Browser, Page } from "@playwright/test";

import { dispatcher } from "../dispatcher";
import condition from "./condition";

import interpolate from "./helper/interpolate";
import type { WorkflowVariables } from "./helper/variables";

type ParallelResult = {
  joinNodeId: string;
  variables: WorkflowVariables;
};

function getNode(workflowArray: any[], nodeId: string) {
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

function getIncomingEdges(
  workflowEdges: any[],
  nodeId: string
) {
  return workflowEdges.filter(
    (edge) => edge.target === nodeId
  );
}

/*
 * Find the first node where all parallel
 * branches can meet.
 */
function findJoinNode(
  workflowArray: any[],
  workflowEdges: any[],
  branchStartIds: string[]
) {
  const reachableByBranch = branchStartIds.map(
    (startId) => {
      const reachable = new Set<string>();
      const queue = [startId];

      while (queue.length > 0) {
        const nodeId = queue.shift()!;

        if (reachable.has(nodeId)) {
          continue;
        }

        reachable.add(nodeId);

        const outgoing = getOutgoingEdges(
          workflowEdges,
          nodeId
        );

        for (const edge of outgoing) {
          if (!reachable.has(edge.target)) {
            queue.push(edge.target);
          }
        }
      }

      return reachable;
    }
  );

  for (const node of workflowArray) {
    const isReachableFromEveryBranch =
      reachableByBranch.every(
        (reachable) =>
          reachable.has(node.id)
      );

    if (!isReachableFromEveryBranch) {
      continue;
    }

    const incoming = getIncomingEdges(
      workflowEdges,
      node.id
    );

    if (incoming.length >= 2) {
      return node.id;
    }
  }

  return null;
}

async function runBranch(
  workflowArray: any[],
  workflowEdges: any[],
  startNodeId: string,
  joinNodeId: string,
  browser: Browser,
  variables: WorkflowVariables
) {
  /*
   * Every parallel branch gets its own page.
   */
  const page = await browser.newPage();

  let currentNodeId = startNodeId;

  try {
    while (currentNodeId) {
      /*
       * The branch is finished once it reaches
       * the common join node.
       */
      if (currentNodeId === joinNodeId) {
        return;
      }

      const currentNode = getNode(
        workflowArray,
        currentNodeId
      );

      console.log(
        `Parallel branch running node ${currentNode.id}: ${currentNode.type}`
      );

      /*
       * Loops inside parallel branches are not
       * supported yet.
       */
      if (currentNode.type === "loop") {
        throw new Error(
          `Loop nodes inside parallel branches are not supported yet`
        );
      }

      /*
       * Conditions inside parallel branches
       * are supported.
       */
      if (currentNode.type === "condition") {
        const resolvedConfig =
          interpolate(
            currentNode.config,
            variables
          );

        const response = await condition(
          resolvedConfig,
          page
        );

        console.log(
          "Parallel condition response:",
          response
        );

        if (!response.success) {
          throw new Error(
            `Condition node ${currentNode.id} failed`
          );
        }

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

        currentNodeId = edge.target;

        continue;
      }

      /*
       * Resolve variables before running the node.
       */
      const resolvedConfig =
        interpolate(
          currentNode.config,
          variables
        );

      const nodeToRun = {
        ...currentNode,
        config: resolvedConfig,
      };

      const response = await dispatcher(
        nodeToRun,
        browser,
        page
      );

      console.log(
        "Parallel response:",
        response
      );

      /*
       * Save variables into THIS branch's
       * variable map.
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
          `Parallel variable "${response.save_as}" =`,
          response.data
        );
      }

      if (!response.success) {
        throw new Error(
          `Parallel node ${currentNode.id} failed`
        );
      }

      const outgoingEdges =
        getOutgoingEdges(
          workflowEdges,
          currentNode.id
        );

      if (outgoingEdges.length === 0) {
        throw new Error(
          `Parallel branch ended before reaching join node ${joinNodeId}`
        );
      }

      /*
       * Normal parallel branch:
       * continue to the next node.
       */
      currentNodeId =
        outgoingEdges[0].target;
    }
  } finally {
    await page.close();
  }
}

export default async function parallel(
  workflowArray: any[],
  workflowEdges: any[],
  currentNodeId: string,
  browser: Browser,
  variables: WorkflowVariables,
  config: any
): Promise<ParallelResult> {
  const outgoingEdges =
    getOutgoingEdges(
      workflowEdges,
      currentNodeId
    );

  if (outgoingEdges.length < 2) {
    throw new Error(
      `Parallel node ${currentNodeId} needs at least 2 outgoing branches`
    );
  }

  const branchStartIds =
    outgoingEdges.map(
      (edge) => edge.target
    );

  console.log(
    `Parallel node ${currentNodeId} starting ${branchStartIds.length} branches`
  );

  /*
   * Find the common join node.
   */
  const joinNodeId =
    findJoinNode(
      workflowArray,
      workflowEdges,
      branchStartIds
    );

  if (!joinNodeId) {
    throw new Error(
      `Parallel node ${currentNodeId} has no common join node`
    );
  }

  console.log(
    `Parallel node ${currentNodeId} join node: ${joinNodeId}`
  );

  /*
   * Each branch receives its own copy of
   * the variables that existed BEFORE
   * the parallel node.
   */
  const branchVariables =
    branchStartIds.map(
      () => new Map(variables)
    );

  /*
   * Run every branch concurrently.
   */
  await Promise.all(
    branchStartIds.map(
      (branchStartId, index) =>
        runBranch(
          workflowArray,
          workflowEdges,
          branchStartId,
          joinNodeId,
          browser,
          branchVariables[index]
        )
    )
  );

  /*
   * IMPORTANT:
   *
   * Variables are NOT merged unless the user
   * explicitly enables merge_variables.
   *
   * Example:
   *
   * config:
   * {
   *   merge_variables: true
   * }
   */
  if (config?.merge_variables === true) {
    console.log(
      `Parallel node ${currentNodeId}: merging branch variables`
    );

    for (const branchVariableMap of branchVariables) {
      for (const [
        key,
        value,
      ] of branchVariableMap) {
        variables.set(
          key,
          value
        );
      }
    }
  } else {
    console.log(
      `Parallel node ${currentNodeId}: variable merging disabled`
    );
  }

  console.log(
    `Parallel node ${currentNodeId} finished all branches`
  );

  return {
    joinNodeId,
    variables,
  };
}