import { Browser, Page } from "@playwright/test";

import { dispatcher } from "../dispatcher";
import condition from "./condition";
import telegram from "./telegram";

import interpolate from "./helper/interpolate";
import type { WorkflowVariables } from "./helper/variables";
import { supabase } from "../../supabase/supabase";
import { decryptSecret } from "./helper/telegram/telegram-security";

type ParallelResult = {
  joinNodeId: string;
  variables: WorkflowVariables;
};

type BranchOutcome = {
  branchIndex: number;
  startNodeId: string;
  success: boolean;
  error?: unknown;
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

/*
 * Run a single Telegram node inside a parallel
 * branch. Mirrors the special-case handling in
 * runner.ts exactly: load the integration, decrypt
 * the bot token, resolve variables, then send.
 *
 * This lives here (rather than in dispatcher.ts)
 * because sending a Telegram message needs the
 * decrypted bot token as a second argument, and
 * dispatcher only ever passes a node's config.
 */
async function runTelegramNode(
  currentNode: any,
  variables: WorkflowVariables
) {
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

  return telegram(resolvedConfig, botToken);
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

  /*
   * Loop iteration counts must be scoped to this
   * branch. Branches run concurrently, so sharing
   * loopState with the main workflow (or with other
   * branches) would let branches stomp on each
   * other's iteration counts.
   */
  const loopState = new Map<string, number>();

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
       * Loops inside parallel branches, with
       * their own isolated iteration counter.
       */
      if (currentNode.type === "loop") {
        const currentIteration =
          loopState.get(currentNode.id) ?? 0;

        const maxIterations =
          currentNode.data.config.max_iterations;

        if (
          maxIterations !== undefined &&
          currentIteration >= maxIterations
        ) {
          console.log(
            `Parallel loop ${currentNode.id} reached max iterations (${maxIterations})`
          );

          loopState.delete(currentNode.id);

          const doneEdge = getEdgeByHandle(
            workflowEdges,
            currentNode.id,
            "done"
          );

          if (!doneEdge) {
            console.log(
              `Parallel loop ${currentNode.id} reached max iterations with no outgoing done edge.`
            );

            return;
          }

          currentNodeId = doneEdge.target;

          continue;
        }

        const loopCondition = interpolate(
          currentNode.data.config.condition,
          variables
        );

        const conditionResponse = await condition(
          loopCondition,
          page
        );

        console.log(
          `Parallel loop ${currentNode.id} condition:`,
          conditionResponse
        );

        if (!conditionResponse.success) {
          throw new Error(
            `Loop ${currentNode.id} condition failed`
          );
        }

        if (!conditionResponse.data) {
          console.log(
            `Parallel loop ${currentNode.id} condition is false`
          );

          loopState.delete(currentNode.id);

          const doneEdge = getEdgeByHandle(
            workflowEdges,
            currentNode.id,
            "done"
          );

          if (!doneEdge) {
            console.log(
              `Parallel loop ${currentNode.id} condition is false with no outgoing done edge.`
            );

            return;
          }

          currentNodeId = doneEdge.target;

          continue;
        }

        const nextIteration = currentIteration + 1;

        loopState.set(currentNode.id, nextIteration);

        console.log(
          `Parallel loop ${currentNode.id}: iteration ${nextIteration}${
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
       * Conditions inside parallel branches
       * are supported.
       */
      if (currentNode.type === "condition") {
        const resolvedConfig =
          interpolate(
            currentNode.data.config,
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
       * Telegram nodes need a decrypted bot token
       * fetched from the integration row, so they
       * can't go through the generic dispatcher
       * (dispatcher only ever passes a node's config,
       * with no bot token argument).
       */
      if (currentNode.type === "telegram") {
        const response = await runTelegramNode(
          currentNode,
          variables
        );

        console.log(
          "Parallel telegram response:",
          response
        );

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

        const outgoingEdges = getOutgoingEdges(
          workflowEdges,
          currentNode.id
        );

        if (outgoingEdges.length === 0) {
          throw new Error(
            `Parallel branch ended before reaching join node ${joinNodeId}`
          );
        }

        currentNodeId = outgoingEdges[0].target;

        continue;
      }

      /*
       * Resolve variables before running the node.
       * Node config lives at currentNode.data.config
       * (matching the shape runner.ts reads), but
       * dispatcher.ts expects a flat .config on the
       * node object it's handed, so nodeToRun below
       * keeps that flat shape for dispatcher's sake.
       */
      const resolvedConfig =
        interpolate(
          currentNode.data.config,
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
   *
   * Promise.allSettled (rather than Promise.all) so
   * that one branch failing doesn't hide what happened
   * to the others: every branch runs to completion (or
   * failure) and we report ALL failures together, not
   * just whichever branch happened to reject first.
   */
  const settledResults = await Promise.allSettled(
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

  const outcomes: BranchOutcome[] =
    settledResults.map((result, index) => ({
      branchIndex: index,
      startNodeId: branchStartIds[index],
      success: result.status === "fulfilled",
      error:
        result.status === "rejected"
          ? result.reason
          : undefined,
    }));

  const failedOutcomes = outcomes.filter(
    (outcome) => !outcome.success
  );

  if (failedOutcomes.length > 0) {
    const failureSummary = failedOutcomes
      .map(
        (outcome) =>
          `branch starting at ${outcome.startNodeId} (${
            outcome.error instanceof Error
              ? outcome.error.message
              : String(outcome.error)
          })`
      )
      .join("; ");

    throw new Error(
      `Parallel node ${currentNodeId} had ${failedOutcomes.length} failing branch(es): ${failureSummary}`
    );
  }

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