"use client"

import type { ToolUIPart } from "ai"
import { CheckIcon, GlobeIcon, MicIcon } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import {
  Attachments,
  Attachment,
  AttachmentPreview,
  AttachmentRemove,
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
  PromptInputHeader,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  type PromptInputMessage,
  usePromptInputAttachments,
} from "@/components/ai-elements/prompt-input"

interface MessageType {
  key: string
  from: "user" | "assistant"
  content: string
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
          onRemove={() => attachments.remove(attachment.id)}
        >
          <AttachmentPreview />
          <AttachmentRemove />
        </Attachment>
      ))}
    </Attachments>
  )
}

export function AgentTab() {
  const [model, setModel] = useState(models[0].id)
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false)

  const [text, setText] = useState("")
  const [useWebSearch, setUseWebSearch] = useState(false)
  const [useMicrophone, setUseMicrophone] = useState(false)

  const [status, setStatus] = useState<
    "submitted" | "streaming" | "ready" | "error"
  >("ready")

  const [messages, setMessages] = useState<MessageType[]>([])

  const selectedModel = models.find(
    (item) => item.id === model
  )

  async function handleSubmit(message: PromptInputMessage) {
    const prompt = message.text?.trim()
    const hasAttachments = Boolean(message.files?.length)

    if (!prompt && !hasAttachments) {
      return
    }

    const userContent =
      prompt || "Sent with attachments"

    const userMessageId = crypto.randomUUID()
    const assistantMessageId = crypto.randomUUID()

    setMessages((prev) => [
      ...prev,
      {
        key: userMessageId,
        from: "user",
        content: userContent,
      },
      {
        key: assistantMessageId,
        from: "assistant",
        content: "",
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

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(
          data.error || "Agent request failed"
        )
      }

      setMessages((prev) =>
        prev.map((message) =>
          message.key === assistantMessageId
            ? {
                ...message,
                content: data.response,
              }
            : message
        )
      )

      setStatus("ready")
    } catch (error) {
      console.error(error)

      const errorMessage =
        error instanceof Error
          ? error.message
          : "Something went wrong"

      setMessages((prev) =>
        prev.map((message) =>
          message.key === assistantMessageId
            ? {
                ...message,
                content: `Error: ${errorMessage}`,
              }
            : message
        )
      )

      setStatus("error")

      toast.error("Agent request failed", {
        description: errorMessage,
      })
    }
  }

  return (
  <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
    <Conversation className="min-h-0 flex-1 border-b">
      <ConversationContent>
        {messages.map((message) => (
          <Message
            key={message.key}
            from={message.from}
          >
            <MessageContent>
              <MessageResponse>
                {message.content}
              </MessageResponse>
            </MessageContent>
          </Message>
        ))}
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
                  setUseMicrophone((prev) => !prev)
                }
                variant={
                  useMicrophone ? "default" : "ghost"
                }
              >
                <MicIcon size={16} />
                <span className="sr-only">
                  Microphone
                </span>
              </PromptInputButton>

              <PromptInputButton
                onClick={() =>
                  setUseWebSearch((prev) => !prev)
                }
                variant={
                  useWebSearch ? "default" : "ghost"
                }
              >
                <GlobeIcon size={16} />
                <span>Search</span>
              </PromptInputButton>

              <ModelSelector
                open={modelSelectorOpen}
                onOpenChange={setModelSelectorOpen}
              >
                <ModelSelectorTrigger asChild>
                  <PromptInputButton>
                    {selectedModel?.chefSlug && (
                      <ModelSelectorLogo
                        provider={selectedModel.chefSlug}
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
                            setModel(item.id)
                            setModelSelectorOpen(false)
                          }}
                        >
                          <ModelSelectorLogo
                            provider={item.chefSlug}
                          />

                          <ModelSelectorName>
                            {item.name}
                          </ModelSelectorName>

                          <ModelSelectorLogoGroup>
                            {item.providers.map(
                              (provider) => (
                                <ModelSelectorLogo
                                  key={provider}
                                  provider={provider}
                                />
                              )
                            )}
                          </ModelSelectorLogoGroup>

                          {model === item.id ? (
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