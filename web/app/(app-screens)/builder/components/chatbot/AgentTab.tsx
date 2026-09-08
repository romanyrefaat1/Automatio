"use client"

import {
  CheckIcon,
  ChevronDownIcon,
  GlobeIcon,
  Loader2Icon,
  MicIcon,
  SparklesIcon,
  TerminalIcon,
} from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import {
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
  Attachments,
} from "@/components/ai-elements/attachments"

import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"

import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message"

import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorLogoGroup,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector"

import {
  PromptInput,
  PromptInputActionAddAttachments,
  PromptInputActionMenu,
  PromptInputActionMenuContent,
  PromptInputActionMenuTrigger,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  type PromptInputMessage,
  usePromptInputAttachments,
  PromptInputHeader,
} from "@/components/ai-elements/prompt-input"

/*
 * ============================================================
 * TYPES
 * ============================================================
 */

type AgentStatus =
  | "ready"
  | "submitted"
  | "streaming"
  | "error"

interface AgentMetadata {
  result: unknown
  done: boolean
}

interface MessageType {
  key: string
  from: "user" | "assistant"
  content?: string
  agent?: AgentMetadata
}

interface AgentApiResponse {
  success?: boolean
  answer?: string
  result?: unknown
  done?: boolean
  error?: string
}

interface WorkflowNode {
  position: number
  type: string
  title: string
  description?: string
  config: Record<string, unknown>
}

interface WorkflowEdge {
  source: number
  target: number
}

interface WorkflowResult {
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
}

/*
 * ============================================================
 * MODELS
 * ============================================================
 */

const models = [
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    chef: "OpenAI",
    chefSlug: "openai",
    providers: ["openai"],
  },
]

/*
 * ============================================================
 * HELPERS
 * ============================================================
 */

function hasMeaningfulResult(
  result: unknown
) {
  if (
    result === null ||
    result === undefined
  ) {
    return false
  }

  if (
    typeof result === "object" &&
    !Array.isArray(result)
  ) {
    return Object.keys(
      result as Record<string, unknown>
    ).length > 0
  }

  return true
}

function isWorkflowResult(
  result: unknown
): result is WorkflowResult {
  if (
    typeof result !== "object" ||
    result === null ||
    Array.isArray(result)
  ) {
    return false
  }

  const value =
    result as Record<string, unknown>

  return (
    Array.isArray(value.nodes) &&
    Array.isArray(value.edges)
  )
}

/*
 * ============================================================
 * ATTACHMENTS
 * ============================================================
 */

function PromptInputAttachmentsDisplay() {
  const attachments =
    usePromptInputAttachments()

  if (
    attachments.files.length === 0
  ) {
    return null
  }

  return (
    <Attachments variant="inline">
      {attachments.files.map(
        (attachment) => (
          <Attachment
            key={attachment.id}
            data={attachment}
            onRemove={() =>
              attachments.remove(
                attachment.id
              )
            }
          >
            <AttachmentPreview />
            <AttachmentRemove />
          </Attachment>
        )
      )}
    </Attachments>
  )
}

/*
 * ============================================================
 * AGENT ACTIVITY
 * ============================================================
 */

function AgentActivity({
  agent,
}: {
  agent: AgentMetadata
}) {
  const [
    resultOpen,
    setResultOpen,
  ] = useState(false)

  const hasResult =
    hasMeaningfulResult(agent.result)

  if (!hasResult) {
    return null
  }

  const workflow =
    isWorkflowResult(agent.result)

  return (
    <div className="mt-2 space-y-2">
      <div className="overflow-hidden rounded-xl border bg-muted/30">
        <button
          type="button"
          onClick={() =>
            setResultOpen(
              (previous) =>
                !previous
            )
          }
          className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-medium transition-colors hover:bg-muted/50"
        >
          {workflow ? (
            <SparklesIcon className="size-3.5" />
          ) : (
            <TerminalIcon className="size-3.5" />
          )}

          <span className="flex-1">
            {workflow
              ? "Generated workflow"
              : "Agent result"}
          </span>

          <ChevronDownIcon
            className={`size-3.5 transition-transform ${
              resultOpen
                ? "rotate-180"
                : ""
            }`}
          />
        </button>

        {resultOpen && (
          <div className="border-t px-3 py-3">
            {workflow && (
              <div className="mb-3 flex items-center gap-2 rounded-lg border bg-background px-3 py-2 text-xs">
                <SparklesIcon className="size-3.5" />

                <span className="font-medium">
                  {agent.result.nodes.length}{" "}
                  {agent.result.nodes.length ===
                  1
                    ? "node"
                    : "nodes"}
                </span>

                <span className="text-muted-foreground">
                  ·
                </span>

                <span className="text-muted-foreground">
                  {agent.result.edges.length}{" "}
                  {agent.result.edges.length ===
                  1
                    ? "connection"
                    : "connections"}
                </span>
              </div>
            )}

            <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-lg bg-background p-3 text-xs leading-relaxed text-muted-foreground">
              {JSON.stringify(
                agent.result,
                null,
                2
              )}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}

/*
 * ============================================================
 * PROCESSING
 * ============================================================
 */

function AgentProcessing() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <SparklesIcon className="size-4" />

      <span>
        Agent is working
      </span>

      <span className="ml-1 flex gap-1">
        <span className="size-1 animate-pulse rounded-full bg-current [animation-delay:-0.3s]" />
        <span className="size-1 animate-pulse rounded-full bg-current [animation-delay:-0.15s]" />
        <span className="size-1 animate-pulse rounded-full bg-current" />
      </span>
    </div>
  )
}

/*
 * ============================================================
 * COMPONENT
 * ============================================================
 */

export function AgentTab() {
  const [model, setModel] =
    useState(models[0].id)

  const [
    modelSelectorOpen,
    setModelSelectorOpen,
  ] = useState(false)

  const [text, setText] =
    useState(
      "Hello, what can you do?"
    )

  const [
    useMicrophone,
    setUseMicrophone,
  ] = useState(false)

  const [status, setStatus] =
    useState<AgentStatus>("ready")

  const [messages, setMessages] =
    useState<MessageType[]>([])

  const selectedModel =
    models.find(
      (item) => item.id === model
    )

  /*
   * ==========================================================
   * SUBMIT
   * ==========================================================
   */

  async function handleSubmit(
    message: PromptInputMessage
  ) {
    const prompt =
      message.text?.trim()

    const hasAttachments =
      Boolean(
        message.files?.length
      )

    if (
      !prompt &&
      !hasAttachments
    ) {
      return
    }

    const userContent =
      prompt ||
      "Sent with attachments"

    const userMessageId =
      crypto.randomUUID()

    const assistantMessageId =
      crypto.randomUUID()

    /*
     * Add the user message and an
     * initially-empty assistant message.
     */
    setMessages(
      (previous) => [
        ...previous,
        {
          key: userMessageId,
          from: "user",
          content: userContent,
        },
        {
          key: assistantMessageId,
          from: "assistant",
          content: "",
          agent: {
            result: {},
            done: false,
          },
        },
      ]
    )

    setText("")
    setStatus("submitted")

    if (
      message.files?.length
    ) {
      toast.success(
        "Files attached",
        {
          description: `${message.files.length} file(s) attached`,
        }
      )
    }

    try {
      setStatus("streaming")

      /*
       * ------------------------------------------------------
       * BACKEND REQUEST
       * ------------------------------------------------------
       *
       * The agent itself decides whether it needs:
       *
       * - fetch_page
       * - call_system_files
       *
       * Nothing about those tools is sent from the
       * frontend anymore.
       */
      const response =
        await fetch(
          "http://localhost:3000/agent",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              prompt: userContent,
            }),
          }
        )

      let data:
        AgentApiResponse

      try {
        data =
          await response.json()
      } catch {
        throw new Error(
          "Backend returned an invalid response."
        )
      }

      console.log(
        "Agent API response:",
        data
      )

      if (
        !response.ok ||
        !data.success
      ) {
        throw new Error(
          data.error ||
            "Agent request failed"
        )
      }

      /*
       * ------------------------------------------------------
       * NORMALIZE RESPONSE
       * ------------------------------------------------------
       */

      const answer =
        typeof data.answer ===
        "string"
          ? data.answer
          : ""

      const result =
        "result" in data
          ? data.result
          : {}

      const done =
        data.done === true

      console.log(
        "Updating assistant message:",
        {
          messageId:
            assistantMessageId,
          answer,
          result,
          done,
        }
      )

      /*
       * ------------------------------------------------------
       * UPDATE ASSISTANT MESSAGE
       * ------------------------------------------------------
       */

      setMessages(
        (previous) =>
          previous.map(
            (item) => {
              if (
                item.key !==
                assistantMessageId
              ) {
                return item
              }

              return {
                ...item,
                content: answer,
                agent: {
                  result,
                  done,
                },
              }
            }
          )
      )

      setStatus("ready")
    } catch (error) {
      console.error(
        "Agent request failed:",
        error
      )

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong"

      setMessages(
        (previous) =>
          previous.map(
            (item) => {
              if (
                item.key !==
                assistantMessageId
              ) {
                return item
              }

              return {
                ...item,
                content:
                  errorMessage,
                agent:
                  undefined,
              }
            }
          )
      )

      setStatus("error")

      toast.error(
        "Agent request failed",
        {
          description:
            errorMessage,
        }
      )
    }
  }

  /*
   * ==========================================================
   * RENDER
   * ==========================================================
   */

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <Conversation className="min-h-0 flex-1">
        <ConversationContent>
          {messages.map(
            (message) => {
              const isAssistant =
                message.from ===
                "assistant"

              const isLatest =
                message.key ===
                messages[
                  messages.length -
                    1
                ]?.key

              const isProcessing =
                isAssistant &&
                isLatest &&
                status ===
                  "streaming" &&
                !message.content

              return (
                <Message
                  key={message.key}
                  from={
                    message.from
                  }
                >
                  <MessageContent>
                    {message.content ? (
                      <MessageResponse>
                        {
                          message.content
                        }
                      </MessageResponse>
                    ) : isProcessing ? (
                      <AgentProcessing />
                    ) : null}

                    {isAssistant &&
                      message.agent && (
                        <AgentActivity
                          agent={
                            message.agent
                          }
                        />
                      )}
                  </MessageContent>
                </Message>
              )
            }
          )}
        </ConversationContent>

        <ConversationScrollButton />
      </Conversation>

      <div className="shrink-0 pt-3">
        <div className="w-full px-3 pb-3">
          <PromptInput
            globalDrop
            multiple
            onSubmit={
              handleSubmit
            }
          >
            <PromptInputHeader>
              <PromptInputAttachmentsDisplay />
            </PromptInputHeader>

            <PromptInputBody>
              <PromptInputTextarea
                value={text}
                onChange={(
                  event
                ) =>
                  setText(
                    event.target
                      .value
                  )
                }
                placeholder="Ask your agent..."
                disabled={
                  status ===
                    "submitted" ||
                  status ===
                    "streaming"
                }
              />
            </PromptInputBody>

            <PromptInputFooter>
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger />

                  <PromptInputActionMenuContent>
                    <PromptInputActionAddAttachments />
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>

                <PromptInputButton
                  onClick={() =>
                    setUseMicrophone(
                      (previous) =>
                        !previous
                    )
                  }
                  variant={
                    useMicrophone
                      ? "default"
                      : "ghost"
                  }
                  disabled={
                    status ===
                    "streaming"
                  }
                >
                  <MicIcon size={16} />

                  <span className="sr-only">
                    Microphone
                  </span>
                </PromptInputButton>

                <ModelSelector
                  open={
                    modelSelectorOpen
                  }
                  onOpenChange={
                    setModelSelectorOpen
                  }
                >
                  <ModelSelectorTrigger
                    asChild
                  >
                    <PromptInputButton
                      disabled={
                        status ===
                        "streaming"
                      }
                    >
                      {selectedModel?.chefSlug && (
                        <ModelSelectorLogo
                          provider={
                            selectedModel.chefSlug
                          }
                        />
                      )}

                      {selectedModel
                        ?.name && (
                        <ModelSelectorName>
                          {
                            selectedModel.name
                          }
                        </ModelSelectorName>
                      )}
                    </PromptInputButton>
                  </ModelSelectorTrigger>

                  <ModelSelectorContent>
                    <ModelSelectorInput placeholder="Search models..." />

                    <ModelSelectorList>
                      <ModelSelectorEmpty>
                        No models
                        found.
                      </ModelSelectorEmpty>

                      <ModelSelectorGroup heading="OpenAI">
                        {models.map(
                          (
                            item
                          ) => (
                            <ModelSelectorItem
                              key={
                                item.id
                              }
                              value={
                                item.id
                              }
                              onSelect={() => {
                                setModel(
                                  item.id
                                )

                                setModelSelectorOpen(
                                  false
                                )
                              }}
                            >
                              <ModelSelectorLogo
                                provider={
                                  item.chefSlug
                                }
                              />

                              <ModelSelectorName>
                                {
                                  item.name
                                }
                              </ModelSelectorName>

                              <ModelSelectorLogoGroup>
                                {item.providers.map(
                                  (
                                    provider
                                  ) => (
                                    <ModelSelectorLogo
                                      key={
                                        provider
                                      }
                                      provider={
                                        provider
                                      }
                                    />
                                  )
                                )}
                              </ModelSelectorLogoGroup>

                              {model ===
                              item.id ? (
                                <CheckIcon className="ml-auto size-4" />
                              ) : (
                                <div className="ml-auto size-4" />
                              )}
                            </ModelSelectorItem>
                          )
                        )}
                      </ModelSelectorGroup>
                    </ModelSelectorList>
                  </ModelSelectorContent>
                </ModelSelector>
              </PromptInputTools>

              <PromptInputSubmit
                disabled={
                  !text.trim() ||
                  status ===
                    "submitted" ||
                  status ===
                    "streaming"
                }
                status={status}
              />
            </PromptInputFooter>
          </PromptInput>
        </div>
      </div>
    </div>
  )
}