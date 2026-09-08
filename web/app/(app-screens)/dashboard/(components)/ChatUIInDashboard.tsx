"use client"

import { useEffect, useState } from "react"
import { ArrowUp } from "lucide-react"

import { PromptInputTextarea } from "@/components/ai-elements/prompt-input"
import { cn } from "@/lib/utils"

const prompts = [
  {
    title: "What's eating my Tuesday mornings?",
    placeholder: "Describe the website, login flow, and what reports to download...",
  },
  {
    title: "Can a bot scrape better than my intern?",
    placeholder: "Tell Automatio which website and what data you need...",
  },
  {
    title: "Ready to never fill out that form again?",
    placeholder: "Describe the form and the information that should be entered...",
  },
  {
    title: "What if a website texted you when it changed?",
    placeholder: "Tell Automatio what website and what change to look for...",
  },
  {
    title: "Tired of copy-pasting between two tabs?",
    placeholder: "Describe where the data comes from and where it should go...",
  },
  {
    title: "Does your signup flow actually work?",
    placeholder: "Describe the signup flow you want Automatio to test...",
  },
  {
    title: "What's the one task you'd love to automate?",
    placeholder: "Describe the task you repeat and Automatio will build the workflow...",
  },
]

export default function ChatUIInDashboard() {
  const [textareaValue, setTextareaValue] = useState("")
  const [currentPrompt, setCurrentPrompt] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPrompt((current) => (current + 1) % prompts.length)
    }, 3500)

    return () => clearInterval(interval)
  }, [])

  const prompt = prompts[currentPrompt]
  const canSend = textareaValue.trim().length > 0

  const handleSubmit = () => {
    if (!canSend) return

    console.log("Message:", textareaValue)

    setTextareaValue("")
  }

  return (
    <div className="flex min-h-full w-full items-center justify-center px-6">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1
            key={currentPrompt}
            className="animate-in fade-in slide-in-from-bottom-2 duration-300 text-3xl font-semibold tracking-tight"
          >
            {prompt.title}
          </h1>

          <p className="mt-2 text-sm text-muted-foreground">
            Describe what you want Automatio to do and we'll build the
            workflow for you.
          </p>
        </div>

        {/* Prompt composer */}
        <div
          className={cn(
            "rounded-2xl border bg-card",
            "border-border shadow-sm",
            "transition-all duration-200",
            "focus-within:border-ring",
            "focus-within:ring-2 focus-within:ring-ring/10"
          )}
        >
          {/* Textarea */}
          <div className="px-5 pt-4 pb-2">
            <PromptInputTextarea
              placeholder={prompt.placeholder}
              value={textareaValue}
              onChange={(e) => setTextareaValue(e.target.value)}
              onKeyDown={(e) => {
                // Enter = send
                // Shift + Enter = new line
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit()
                }
              }}
              className={cn(
                "min-h-[100px] w-full resize-none",
                "border-0 bg-transparent p-0",
                "shadow-none outline-none",
                "focus-visible:ring-0 focus-visible:ring-offset-0",
                "text-[15px]"
              )}
            />
          </div>

          {/* Send button */}
          <div className="flex justify-end px-4 pb-3">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSend}
              aria-label="Send message"
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-full",
                "transition-all duration-150",
                canSend
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-muted text-muted-foreground opacity-60"
              )}
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}