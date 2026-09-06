import { Browser, Page } from "@playwright/test";

import { dispatcher } from "./dispatcher";
import condition from "./nodes/condition";
import parallel from "./nodes/parallel";
import interpolate from "./nodes/helper/interpolate";
import type { WorkflowVariables } from "./nodes/helper/variables";
import { supabase } from "../supabase/supabase";
import { decryptSecret } from "./nodes/helper/telegram/telegram-security";
import telegram from "./nodes/telegram";
import { end } from "./nodes/end";

type RunStepHandle = {
  id: string;
};

type NodeResponse = {
  success: boolean;
  data?: unknown;
  save_as?: string;
  error?: unknown;
};

function getNode(
  workflowArray: any[],
  nodeId: string,
) {
  const node = workflowArray.find(
    (node) => node.id === nodeId,
  );

  if (!node) {
    throw new Error(
      `Node ${nodeId} not found`,
    );
  }

  return node;
}

function getOutgoingEdges(
  workflowEdges: any[],
  nodeId: string,
) {
  return workflowEdges.filter(
    (edge) => edge.source === nodeId,
  );
}

function getEdgeByHandle(
  workflowEdges: any[],
  nodeId: string,
  handle: string,
) {
  return workflowEdges.find(
    (edge) =>
      edge.source === nodeId &&
      edge.sourceHandle === handle,
  );
}

function errorToString(
  error: unknown,
) {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

async function createRunStep(
  runId: string,
  position: number,
  node: any,
): Promise<RunStepHandle> {
  const { data, error } = await supabase
    .from("automation_run_steps")
    .insert({
      run_id: runId,
      step_id: node.id,
      position,
      step_type: node.type,
      step_config:
        node.data?.config ?? {},
      status: "running",
      started_at:
        new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(
      `Failed to create run step for ${node.id}: ${error.message}`,
    );
  }

  return {
    id: data.id,
  };
}

async function updateRunStep(
  runStepId: string,
  updates: {
    status:
      | "running"
      | "completed"
      | "failed"
      | "skipped";
    result?: unknown;
    error?: unknown;
    step_config?: unknown;
  },
) {
  const payload: {
    status:
      | "running"
      | "completed"
      | "failed"
      | "skipped";
    finished_at?: string;
    result?: unknown;
    error?: string | null;
    step_config?: unknown;
  } = {
    status: updates.status,
  };

  if (
    updates.status ===
      "completed" ||
    updates.status ===
      "failed" ||
    updates.status ===
      "skipped"
  ) {
    payload.finished_at =
      new Date().toISOString();
  }

  if (
    updates.result !==
    undefined
  ) {
    payload.result =
      updates.result;
  }

  if (
    updates.error !==
    undefined
  ) {
    payload.error =
      updates.error === null
        ? null
        : errorToString(
            updates.error,
          );
  }

  if (
    updates.step_config !==
    undefined
  ) {
    payload.step_config =
      updates.step_config;
  }

  const { error } =
    await supabase
      .from(
        "automation_run_steps",
      )
      .update(payload)
      .eq("id", runStepId);

  if (error) {
    console.error(
      `Failed to update run step ${runStepId}:`,
      error,
    );
  }
}

async function completeRunStep(
  runStepId: string,
  result?: unknown,
  stepConfig?: unknown,
) {
  await updateRunStep(
    runStepId,
    {
      status: "completed",
      result:
        result === undefined
          ? null
          : result,
      error: null,
      step_config:
        stepConfig,
    },
  );
}

async function failRunStep(
  runStepId: string,
  error: unknown,
  result?: unknown,
  stepConfig?: unknown,
) {
  await updateRunStep(
    runStepId,
    {
      status: "failed",
      result:
        result === undefined
          ? null
          : result,
      error,
      step_config:
        stepConfig,
    },
  );
}

export default async function runner(
  workflowArray: any[],
  workflowEdges: any[],
  browser: Browser,
  page: Page,
  runId: string,
) {
  if (workflowArray.length === 0) {
    throw new Error(
      "Empty workflowArray",
    );
  }

  if (!runId) {
    throw new Error(
      "runner requires a runId",
    );
  }

  let currentNodeId =
    workflowArray[0].id;

  /*
   * IMPORTANT:
   *
   * This is the execution position,
   * not the workflow/editor position.
   *
   * The same node may execute more
   * than once because of loops.
   */
  let executionPosition = 0;

  const loopState =
    new Map<string, number>();

  /*
   * Stack of loop node IDs we are
   * currently inside.
   */
  const loopStack: string[] = [];

  const variables: WorkflowVariables =
    new Map();

  while (currentNodeId) {
    const currentNode =
      getNode(
        workflowArray,
        currentNodeId,
      );

    console.log(
      `Running node ${currentNode.id}: ${currentNode.type}`,
    );

    /*
     * Trigger and end are control
     * concepts and are not persisted
     * as executable run steps.
     */
    const shouldTrack =
      currentNode.type !==
        "trigger" &&
      currentNode.type !==
        "end";

    let runStep:
      | RunStepHandle
      | null = null;

    let runStepFinished = false;

    /*
     * Create the run-step BEFORE
     * doing any actual work.
     *
     * This means the UI can immediately
     * see:
     *
     * status = running
     * started_at = ...
     */
    if (shouldTrack) {
      runStep =
        await createRunStep(
          runId,
          executionPosition++,
          currentNode,
        );
    }

    /*
     * Finish the current run step exactly
     * once.
     */
    const finishStep = async (
      status:
        | "completed"
        | "failed"
        | "skipped",
      result?: unknown,
      error?: unknown,
      stepConfig?: unknown,
    ) => {
      if (
        !runStep ||
        runStepFinished
      ) {
        return;
      }

      runStepFinished = true;

      await updateRunStep(
        runStep.id,
        {
          status,
          result:
            result === undefined
              ? null
              : result,
          error:
            error === undefined
              ? null
              : error,
          step_config:
            stepConfig ===
            undefined
              ? undefined
              : stepConfig,
        },
      );
    };

    try {
      /*
       * ========================================
       * TRIGGER
       * ========================================
       */

      if (
        currentNode.type ===
        "trigger"
      ) {
        console.log(
          "Skipping trigger node",
        );

        const outgoingEdges =
          getOutgoingEdges(
            workflowEdges,
            currentNode.id,
          );

        if (
          outgoingEdges.length ===
          0
        ) {
          console.log(
            `Trigger ${currentNode.id} has no outgoing edges. Workflow finished.`,
          );

          break;
        }

        currentNodeId =
          outgoingEdges[0].target;

        continue;
      }

      /*
       * ========================================
       * END
       * ========================================
       */

      if (
        currentNode.type === "end"
      ) {
        console.log(
          `End node ${currentNode.id} reached. Workflow finished.`,
        );

        await end(
          browser,
        );

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
        if (!runStep) {
          throw new Error(
            `Missing run step for ${currentNode.id}`,
          );
        }

        const parallelResult =
          await parallel(
            workflowArray,
            workflowEdges,
            currentNode.id,
            browser,
            variables,
            currentNode.data
              .config,
          );

        /*
         * The parallel node itself is
         * complete once every branch has
         * completed and the helper gives
         * us the common join node.
         */
        await finishStep(
          "completed",
          parallelResult,
          currentNode.data
            .config,
        );

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
        if (!runStep) {
          throw new Error(
            `Missing run step for ${currentNode.id}`,
          );
        }

        const currentIteration =
          loopState.get(
            currentNode.id,
          ) ?? 0;

        const maxIterations =
          currentNode.data
            .config
            .max_iterations;

        /*
         * Maximum iteration limit
         * reached.
         */
        if (
          maxIterations !==
            undefined &&
          currentIteration >=
            maxIterations
        ) {
          console.log(
            `Loop ${currentNode.id} reached max iterations (${maxIterations})`,
          );

          loopState.delete(
            currentNode.id,
          );

          const exitIdx =
            loopStack.lastIndexOf(
              currentNode.id,
            );

          if (exitIdx !== -1) {
            loopStack.splice(
              exitIdx,
              1,
            );
          }

          const doneEdge =
            getEdgeByHandle(
              workflowEdges,
              currentNode.id,
              "done",
            );

          if (!doneEdge) {
            await finishStep(
              "completed",
              {
                reason:
                  "max_iterations_reached",
                iteration:
                  currentIteration,
              },
              undefined,
              currentNode.data
                .config,
            );

            console.log(
              `Loop ${currentNode.id} reached max iterations with no outgoing done edge. Workflow finished.`,
            );

            break;
          }

          await finishStep(
            "completed",
            {
              reason:
                "max_iterations_reached",
              iteration:
                currentIteration,
            },
            undefined,
            currentNode.data
              .config,
          );

          currentNodeId =
            doneEdge.target;

          continue;
        }

        /*
         * Resolve loop condition.
         */
        const loopCondition =
          currentNode.data
            .config
            .condition;

        console.log(
          `Loop ${currentNode.id} condition config:`,
          loopCondition,
        );

        const conditionResponse =
          await condition(
            loopCondition,
            page,
            variables,
          );

        console.log(
          `Loop ${currentNode.id} condition result:`,
          conditionResponse,
        );

        if (
          !conditionResponse.success
        ) {
          await finishStep(
            "failed",
            null,
            conditionResponse.error,
            currentNode.data
              .config,
          );

          throw new Error(
            `Loop ${currentNode.id} condition failed: ${
              conditionResponse.error instanceof
              Error
                ? conditionResponse
                    .error
                    .message
                : String(
                    conditionResponse.error,
                  )
            }`,
          );
        }

        /*
         * Condition is false →
         * leave loop.
         */
        if (
          !conditionResponse.data
        ) {
          console.log(
            `Loop ${currentNode.id} condition is false`,
          );

          loopState.delete(
            currentNode.id,
          );

          const exitIdx =
            loopStack.lastIndexOf(
              currentNode.id,
            );

          if (exitIdx !== -1) {
            loopStack.splice(
              exitIdx,
              1,
            );
          }

          const doneEdge =
            getEdgeByHandle(
              workflowEdges,
              currentNode.id,
              "done",
            );

          await finishStep(
            "completed",
            {
              condition_result:
                false,
              iteration:
                currentIteration,
              branch:
                "done",
            },
            undefined,
            currentNode.data
              .config,
          );

          if (!doneEdge) {
            console.log(
              `Loop ${currentNode.id} condition is false with no outgoing done edge. Workflow finished.`,
            );

            break;
          }

          currentNodeId =
            doneEdge.target;

          continue;
        }

        /*
         * Condition is true →
         * enter body.
         */
        const nextIteration =
          currentIteration + 1;

        loopState.set(
          currentNode.id,
          nextIteration,
        );

        console.log(
          `Loop ${currentNode.id}: iteration ${nextIteration}${
            maxIterations !==
            undefined
              ? `/${maxIterations}`
              : ""
          }`,
        );

        const bodyEdge =
          getEdgeByHandle(
            workflowEdges,
            currentNode.id,
            "body",
          );

        if (!bodyEdge) {
          await finishStep(
            "failed",
            {
              condition_result:
                true,
              iteration:
                nextIteration,
            },
            `Loop ${currentNode.id} has no body edge`,
            currentNode.data
              .config,
          );

          throw new Error(
            `Loop ${currentNode.id} has no body edge`,
          );
        }

        /*
         * Push this loop onto the
         * stack.
         */
        loopStack.push(
          currentNode.id,
        );

        await finishStep(
          "completed",
          {
            condition_result:
              true,
            iteration:
              nextIteration,
            branch:
              "body",
          },
          undefined,
          currentNode.data
            .config,
        );

        currentNodeId =
          bodyEdge.target;

        continue;
      }

      /*
       * ========================================
       * CONDITION
       * ========================================
       */

      if (
        currentNode.type ===
        "condition"
      ) {
        if (!runStep) {
          throw new Error(
            `Missing run step for ${currentNode.id}`,
          );
        }

        console.log(
          "Condition config:",
          currentNode.data
            .config,
        );

        const response =
          await condition(
            currentNode.data
              .config,
            page,
            variables,
          );

        console.log(
          "Condition response:",
          response,
        );

        if (!response.success) {
          await finishStep(
            "failed",
            response.data ??
              null,
            response.error,
            currentNode.data
              .config,
          );

          throw new Error(
            `Condition node ${currentNode.id} failed: ${
              response.error instanceof
              Error
                ? response.error
                    .message
                : String(
                    response.error,
                  )
            }`,
          );
        }

        const handle =
          response.data
            ? "true"
            : "false";

        console.log(
          "Condition node:",
          currentNode.id,
        );

        console.log(
          "Expected handle:",
          handle,
        );

        console.log(
          "Outgoing condition edges:",
          workflowEdges.filter(
            (edge) =>
              edge.source ===
              currentNode.id,
          ),
        );

        const edge =
          getEdgeByHandle(
            workflowEdges,
            currentNode.id,
            handle,
          );

        if (!edge) {
          await finishStep(
            "failed",
            response.data ??
              null,
            `Condition node ${currentNode.id} has no ${handle} branch`,
            currentNode.data
              .config,
          );

          throw new Error(
            `Condition node ${currentNode.id} has no ${handle} branch`,
          );
        }

        console.log(
          `Condition ${currentNode.id}: ${handle}`,
        );

        await finishStep(
          "completed",
          {
            condition_result:
              Boolean(
                response.data,
              ),
            branch: handle,
          },
          undefined,
          currentNode.data
            .config,
        );

        currentNodeId =
          edge.target;

        continue;
      }

      /*
       * ========================================
       * TELEGRAM
       * ========================================
       */

      if (
        currentNode.type ===
        "telegram"
      ) {
        if (!runStep) {
          throw new Error(
            `Missing run step for ${currentNode.id}`,
          );
        }

        console.log(
          "Telegram from runner",
          currentNode,
        );

        const telegramConfig =
          currentNode.data
            .config;

        const integrationId =
          telegramConfig.integration_id;

        if (!integrationId) {
          throw new Error(
            `Telegram node ${currentNode.id} is missing integration_id`,
          );
        }

        const {
          data: integration,
          error,
        } = await supabase
          .from("integrations")
          .select(
            "id, type, name, config, secret",
          )
          .eq(
            "id",
            integrationId,
          )
          .single();

        if (error) {
          throw new Error(
            `Failed to load Telegram integration: ${error.message}`,
          );
        }

        if (!integration) {
          throw new Error(
            `Telegram integration ${integrationId} not found`,
          );
        }

        if (
          integration.type !==
          "telegram"
        ) {
          throw new Error(
            `Integration ${integrationId} is not a Telegram integration`,
          );
        }

        if (!integration.secret) {
          throw new Error(
            `Telegram integration ${integrationId} has no bot token`,
          );
        }

        const chatId =
          integration.config
            ?.chat_id;

        if (!chatId) {
          throw new Error(
            `Telegram integration ${integrationId} is missing chat_id`,
          );
        }

        const botToken =
          decryptSecret(
            integration.secret,
          );

        const resolvedConfig =
          interpolate(
            {
              ...telegramConfig,
              chat_id: chatId,
            },
            variables,
          );

        const response =
          (await telegram(
            resolvedConfig,
            botToken,
          )) as NodeResponse;

        console.log(
          "Telegram response:",
          response,
        );

        /*
         * Persist the resolved values
         * because they are the values
         * that were actually executed.
         */
        if (!response.success) {
          await finishStep(
            "failed",
            response.data ??
              null,
            response.error ??
              "Telegram node failed",
            resolvedConfig,
          );

          throw new Error(
            `Telegram node ${currentNode.id} failed`,
          );
        }

        if (response.save_as) {
          variables.set(
            response.save_as,
            response.data,
          );

          console.log(
            `Variable "${response.save_as}" =`,
            response.data,
          );
        }

        await finishStep(
          "completed",
          response.data ??
            null,
          undefined,
          resolvedConfig,
        );

        const outgoingEdges =
          getOutgoingEdges(
            workflowEdges,
            currentNode.id,
          );

        if (
          outgoingEdges.length ===
          0
        ) {
          if (
            loopStack.length >
            0
          ) {
            const enclosingLoopId =
              loopStack[
                loopStack.length -
                  1
              ];

            console.log(
              `Telegram node ${currentNode.id} body end → returning to loop ${enclosingLoopId}`,
            );

            currentNodeId =
              enclosingLoopId;

            continue;
          }

          console.log(
            `Telegram node ${currentNode.id} has no outgoing edges. Workflow finished.`,
          );

          break;
        }

        currentNodeId =
          outgoingEdges[0].target;

        continue;
      }

      /*
       * ========================================
       * NORMAL NODE
       * ========================================
       */

      if (!runStep) {
        throw new Error(
          `Missing run step for ${currentNode.id}`,
        );
      }

      const resolvedConfig =
        interpolate(
          currentNode.data
            .config,
          variables,
        );

      console.log(
        "CurrentNode:",
        currentNode,
      );

      console.log(
        "CurrentConfig:",
        currentNode.data,
      );

      console.log(
        "ResolvedConfig:",
        resolvedConfig,
      );

      const nodeToRun = {
        ...currentNode,
        config:
          resolvedConfig,
      };

      const response =
        (await dispatcher(
          nodeToRun,
          browser,
          page,
          variables,
        )) as NodeResponse;

      console.log(
        "Response:",
        response,
      );

      /*
       * Persist the resolved config
       * used by the runner.
       */
      if (!response.success) {
        await finishStep(
          "failed",
          response.data ??
            null,
          response.error ??
            `Node ${currentNode.id} failed`,
          resolvedConfig,
        );

        throw new Error(
          response.error
            ? errorToString(
                response.error,
              )
            : `Node ${currentNode.id} failed`,
        );
      }

      /*
       * Save the result into the
       * workflow variable map.
       */
      if (
        response.save_as
      ) {
        variables.set(
          response.save_as,
          response.data,
        );

        console.log(
          `Variable "${response.save_as}" =`,
          response.data,
        );
      }

      await finishStep(
        "completed",
        response.data ??
          null,
        undefined,
        resolvedConfig,
      );

      /*
       * ========================================
       * FIND NEXT NODE
       * ========================================
       */

      const outgoingEdges =
        getOutgoingEdges(
          workflowEdges,
          currentNode.id,
        );

      if (
        outgoingEdges.length ===
        0
      ) {
        /*
         * If we're inside a loop body,
         * return to the nearest enclosing
         * loop.
         */
        if (
          loopStack.length > 0
        ) {
          const enclosingLoopId =
            loopStack[
              loopStack.length - 1
            ];

          console.log(
            `Node ${currentNode.id} body end → returning to loop ${enclosingLoopId}`,
          );

          currentNodeId =
            enclosingLoopId;

          continue;
        }

        console.log(
          `Node ${currentNode.id} has no outgoing edges. Workflow finished.`,
        );

        break;
      }

      currentNodeId =
        outgoingEdges[0].target;
    } catch (error) {
      /*
       * Any unexpected exception means
       * the currently-running step failed.
       *
       * This covers things such as:
       *
       * - Playwright exceptions
       * - browser errors
       * - integration errors
       * - dispatcher exceptions
       * - unexpected JavaScript errors
       */
      if (
        runStep &&
        !runStepFinished
      ) {
        await failRunStep(
          runStep.id,
          error,
          null,
          currentNode.data
            ?.config,
        );

        runStepFinished = true;
      }

      throw error;
    }
  }
}