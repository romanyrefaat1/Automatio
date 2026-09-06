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

type AgentStatus =
  | "ready"
  | "submitted"
  | "streaming"
  | "error"

interface AgentMetadata {
  fetchUrls: string[]
  result: unknown
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
  fetchUrls?: string[]
  result?: unknown
  error?: string
}

const models = [
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    chef: "OpenAI",
    chefSlug: "openai",
    providers: ["openai"],
  },
]

function PromptInputAttachmentsDisplay() {
  const attachments = usePromptInputAttachments()

  if (attachments.files.length === 0) {
    return null
  }

  return (
    <Attachments variant="inline">
      {attachments.files.map((attachment) => (
        <Attachment
          key={attachment.id}
          data={attachment}
          onRemove={() =>
            attachments.remove(attachment.id)
          }
        >
          <AttachmentPreview />
          <AttachmentRemove />
        </Attachment>
      ))}
    </Attachments>
  )
}

function getHostname(url: string) {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

function hasMeaningfulResult(result: unknown) {
  if (result === null || result === undefined) {
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

function isWorkflowResult(result: unknown) {
  return (
    typeof result === "object" &&
    result !== null &&
    !Array.isArray(result) &&
    "steps" in
      (result as Record<string, unknown>)
  )
}

function AgentActivity({
  agent,
  active = false,
}: {
  agent: AgentMetadata
  active?: boolean
}) {
  const [resultOpen, setResultOpen] = useState(false)

  const hasUrls = agent.fetchUrls.length > 0
  const hasResult = hasMeaningfulResult(
    agent.result
  )

  if (!hasUrls && !hasResult) {
    return null
  }

  return (
    <div className="mt-2 space-y-2">
      {hasUrls && (
        <div className="rounded-xl border bg-muted/30 p-3">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium">
            {active ? (
              <Loader2Icon className="size-3.5 animate-spin" />
            ) : (
              <GlobeIcon className="size-3.5" />
            )}

            <span>
              {active
                ? "Inspecting websites"
                : "Web pages requested"}
            </span>
          </div>

          <div className="space-y-1.5">
            {agent.fetchUrls.map((url) => (
              <div
                key={url}
                className="flex min-w-0 items-center gap-2 rounded-lg border bg-background px-2.5 py-2"
              >
                <GlobeIcon className="size-3.5 shrink-0 text-muted-foreground" />

                <span className="min-w-0 flex-1 truncate text-xs">
                  {getHostname(url)}
                </span>

                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {active
                    ? "Fetching..."
                    : "Requested"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasResult && (
        <div className="overflow-hidden rounded-xl border bg-muted/30">
          <button
            type="button"
            onClick={() =>
              setResultOpen((previous) => !previous)
            }
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-medium transition-colors hover:bg-muted/50"
          >
            <TerminalIcon className="size-3.5" />

            <span className="flex-1">
              {isWorkflowResult(agent.result)
                ? "Workflow"
                : "Result"}
            </span>

            <ChevronDownIcon
              className={`size-3.5 transition-transform ${
                resultOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {resultOpen && (
            <div className="border-t px-3 py-3">
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap break-words text-xs leading-relaxed text-muted-foreground">
                {JSON.stringify(
                  agent.result,
                  null,
                  2
                )}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function AgentProcessing() {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <SparklesIcon className="size-4" />

      <span>Agent is working</span>

      <span className="ml-1 flex gap-1">
        <span className="size-1 animate-pulse rounded-full bg-current [animation-delay:-0.3s]" />
        <span className="size-1 animate-pulse rounded-full bg-current [animation-delay:-0.15s]" />
        <span className="size-1 animate-pulse rounded-full bg-current" />
      </span>
    </div>
  )
}

export function AgentTab() {
  const [model, setModel] = useState(
    models[0].id
  )

  const [modelSelectorOpen, setModelSelectorOpen] =
    useState(false)

  const [text, setText] = useState(
    "Hello, what can you do?"
  )

  const [useWebSearch, setUseWebSearch] =
    useState(false)

  const [useMicrophone, setUseMicrophone] =
    useState(false)

  const [status, setStatus] =
    useState<AgentStatus>("ready")

  const [messages, setMessages] =
    useState<MessageType[]>([])

  const selectedModel = models.find(
    (item) => item.id === model
  )

  async function handleSubmit(
    message: PromptInputMessage
  ) {
    const prompt = message.text?.trim()

    const hasAttachments =
      Boolean(message.files?.length)

    if (!prompt && !hasAttachments) {
      return
    }

    const userContent =
      prompt || "Sent with attachments"

    const userMessageId =
      crypto.randomUUID()

    const assistantMessageId =
      crypto.randomUUID()

    /*
     * Add both messages immediately.
     *
     * The assistant message starts empty so the
     * processing indicator can be displayed while
     * the backend is working.
     */
    setMessages((previous) => [
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
          fetchUrls: [],
          result: {},
        },
      },
    ])

    setText("")
    setStatus("submitted")

    if (message.files?.length) {
      toast.success("Files attached", {
        description: `${message.files.length} file(s) attached`,
      })
    }

    try {
      setStatus("streaming")

      const response = await fetch(
        "http://localhost:3000/agent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            prompt: userContent,
            fetchPage: useWebSearch,
          }),
        }
      )

      let data: AgentApiResponse

      try {
        data = await response.json()
      } catch {
        throw new Error(
          "Backend returned an invalid response."
        )
      }

      console.log(
        "Agent API response:",
        data
      )

      if (!response.ok || !data.success) {
        throw new Error(
          data.error ||
            "Agent request failed"
        )
      }

      /*
       * Normalize the API response.
       */
      const answer =
        typeof data.answer === "string"
          ? data.answer
          : ""

      const fetchUrls =
        Array.isArray(data.fetchUrls)
          ? data.fetchUrls.filter(
              (url): url is string =>
                typeof url === "string"
            )
          : []

      const result =
        "result" in data
          ? data.result
          : {}

      console.log(
        "Updating assistant message:",
        {
          messageId: assistantMessageId,
          answer,
          fetchUrls,
          result,
        }
      )

      /*
       * IMPORTANT:
       *
       * The actual visible assistant response is stored
       * directly in `content`.
       *
       * `agent` contains only execution metadata.
       */
      setMessages((previous) =>
        previous.map((item) => {
          if (
            item.key !== assistantMessageId
          ) {
            return item
          }

          return {
            ...item,
            content: answer,
            agent: {
              fetchUrls,
              result,
            },
          }
        })
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

      setMessages((previous) =>
        previous.map((item) => {
          if (
            item.key !== assistantMessageId
          ) {
            return item
          }

          return {
            ...item,
            content: errorMessage,
            agent: undefined,
          }
        })
      )

      setStatus("error")

      toast.error("Agent request failed", {
        description: errorMessage,
      })
    }
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <Conversation className="min-h-0 flex-1">
        <ConversationContent>
          {messages.map((message) => {
            const isAssistant =
              message.from === "assistant"

            const isLatest =
              message.key ===
              messages[
                messages.length - 1
              ]?.key

            const isProcessing =
              isAssistant &&
              isLatest &&
              status === "streaming" &&
              !message.content

            return (
              <Message
                key={message.key}
                from={message.from}
              >
                <MessageContent>
                  {message.content ? (
                    <MessageResponse>
                      {message.content}
                    </MessageResponse>
                  ) : isProcessing ? (
                    <AgentProcessing />
                  ) : null}

                  {isAssistant &&
                    message.agent && (
                      <AgentActivity
                        agent={message.agent}
                        active={isProcessing}
                      />
                    )}
                </MessageContent>
              </Message>
            )
          })}
        </ConversationContent>

        <ConversationScrollButton />
      </Conversation>

      <div className="shrink-0 pt-3">
        <div className="w-full px-3 pb-3">
          <PromptInput
            globalDrop
            multiple
            onSubmit={handleSubmit}
          >
            <PromptInputHeader>
              <PromptInputAttachmentsDisplay />
            </PromptInputHeader>

            <PromptInputBody>
              <PromptInputTextarea
                value={text}
                onChange={(event) =>
                  setText(event.target.value)
                }
                placeholder="Ask your agent..."
                disabled={
                  status === "submitted" ||
                  status === "streaming"
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
                    status === "streaming"
                  }
                >
                  <MicIcon size={16} />

                  <span className="sr-only">
                    Microphone
                  </span>
                </PromptInputButton>

                <PromptInputButton
                  onClick={() =>
                    setUseWebSearch(
                      (previous) =>
                        !previous
                    )
                  }
                  variant={
                    useWebSearch
                      ? "default"
                      : "ghost"
                  }
                  disabled={
                    status === "streaming"
                  }
                >
                  <GlobeIcon size={16} />

                  <span>Search</span>
                </PromptInputButton>

                <ModelSelector
                  open={modelSelectorOpen}
                  onOpenChange={
                    setModelSelectorOpen
                  }
                >
                  <ModelSelectorTrigger
                    asChild
                  >
                    <PromptInputButton
                      disabled={
                        status === "streaming"
                      }
                    >
                      {selectedModel?.chefSlug && (
                        <ModelSelectorLogo
                          provider={
                            selectedModel.chefSlug
                          }
                        />
                      )}

                      {selectedModel?.name && (
                        <ModelSelectorName>
                          {selectedModel.name}
                        </ModelSelectorName>
                      )}
                    </PromptInputButton>
                  </ModelSelectorTrigger>

                  <ModelSelectorContent>
                    <ModelSelectorInput placeholder="Search models..." />

                    <ModelSelectorList>
                      <ModelSelectorEmpty>
                        No models found.
                      </ModelSelectorEmpty>

                      <ModelSelectorGroup heading="OpenAI">
                        {models.map((item) => (
                          <ModelSelectorItem
                            key={item.id}
                            value={item.id}
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
                              {item.name}
                            </ModelSelectorName>

                            <ModelSelectorLogoGroup>
                              {item.providers.map(
                                (provider) => (
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
                        ))}
                      </ModelSelectorGroup>
                    </ModelSelectorList>
                  </ModelSelectorContent>
                </ModelSelector>
              </PromptInputTools>

              <PromptInputSubmit
                disabled={
                  !text.trim() ||
                  status === "submitted" ||
                  status === "streaming"
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