/* web/components/nodes/configs/TelegramConfig.tsx */
"use client";

import { useState } from "react";

import Image from "next/image";
import Link from "next/link";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

import {
  Timeline,
  TimelineItem,
  TimelineHeader,
  TimelineTitle,
  TimelineContent,
} from "@/components/timeline";

import { useUser } from "@/contexts/user-context";
import { addIntegration } from "@/actions/integrations";

import { InputOrTextareaWithVariablesSupport } from "@/app/(app-screens)/builder/components/InputAndTextareaWithVariablesSupport";

import type { NodeConfigComponentProps } from "./index";

export default function TelegramConfig({
  config,
  onConfigChange,
}: NodeConfigComponentProps<"telegram">) {
  const { integrations } = useUser();

  const [showAddBotModal, setShowAddBotModal] = useState(false);

  // Create bot state
  const [botName, setBotName] = useState("");
  const [createBotToken, setCreateBotToken] = useState("");
  const [createChatId, setCreateChatId] = useState("");
  const [creatingBot, setCreatingBot] = useState(false);
  const [createBotError, setCreateBotError] = useState<string | null>(
    null
  );

  // Connect existing bot state
  const [connectBotToken, setConnectBotToken] = useState("");
  const [connectBotName, setConnectBotName] = useState("");
  const [connectChatId, setConnectChatId] = useState("");
  const [connectingBot, setConnectingBot] = useState(false);
  const [connectBotError, setConnectBotError] = useState<string | null>(
    null
  );

  const telegramBots = integrations.filter(
    (integration) => integration.type === "telegram"
  );

  async function handleCreateBot() {
    if (
      !botName.trim() ||
      !createBotToken.trim() ||
      !createChatId.trim()
    ) {
      return;
    }

    setCreatingBot(true);
    setCreateBotError(null);

    try {
      const result = await addIntegration({
        type: "telegram",
        name: botName.trim(),
        config: {
          chat_id: createChatId.trim(),
        },
        secret: createBotToken.trim(),
      });

      if (result.error) {
        setCreateBotError(result.error);
        return;
      }

      if (!result.data) {
        setCreateBotError("Failed to create Telegram bot.");
        return;
      }

      onConfigChange({
        ...config,
        integration_id: result.data.id,
      });

      setShowAddBotModal(false);

      setBotName("");
      setCreateBotToken("");
      setCreateChatId("");
    } catch (error) {
      setCreateBotError(
        error instanceof Error
          ? error.message
          : "Failed to create Telegram bot."
      );
    } finally {
      setCreatingBot(false);
    }
  }

  async function handleConnectBot() {
    if (!connectBotToken.trim() || !connectChatId.trim()) {
      return;
    }

    setConnectingBot(true);
    setConnectBotError(null);

    try {
      const result = await addIntegration({
  type: "telegram",
  name: connectBotName.trim() || "Telegram Bot",
  config: {
    chat_id: connectChatId.trim(),
  },
  secret: connectBotToken.trim(),
});

      if (result.error) {
        setConnectBotError(result.error);
        return;
      }

      if (!result.data) {
        setConnectBotError("Failed to connect Telegram bot.");
        return;
      }

      onConfigChange({
        ...config,
        integration_id: result.data.id,
      });

      setShowAddBotModal(false);

      setConnectBotName("");
      setConnectBotToken("");
      setConnectChatId("");
    } catch (error) {
      setConnectBotError(
        error instanceof Error
          ? error.message
          : "Failed to connect Telegram bot."
      );
    } finally {
      setConnectingBot(false);
    }
  }

  function handleModalChange(open: boolean) {
    setShowAddBotModal(open);

    if (!open) {
      setCreateBotError(null);
      setConnectBotError(null);
    }
  }

  return (
    <>
      <div className="space-y-4">
        {/* Telegram Bot */}
        <div className="space-y-2">
          <Label>Telegram Bot</Label>

          <Select
            value={config.integration_id ?? undefined}
            onValueChange={(value) => {
              if (value === "__add_bot__") {
                setShowAddBotModal(true);
                return;
              }

              onConfigChange({
                ...config,
                integration_id: value,
              });
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a Telegram bot" />
            </SelectTrigger>

            <SelectContent>
              {telegramBots.length > 0 ? (
                telegramBots.map((bot) => (
                  <SelectItem key={bot.id} value={bot.id}>
                    {bot.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="__no_bots__" disabled>
                  No Telegram bots connected
                </SelectItem>
              )}

              <SelectItem value="__add_bot__">
                + Add a new Telegram bot
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Chat ID */}
        {/* <div className="space-y-2">
          <Label>Chat ID</Label>

          <Input
            value={config.chat_id ?? ""}
            onChange={(e) =>
              onConfigChange({
                ...config,
                chat_id: e.target.value,
              })
            }
            placeholder="123456789"
          />

          <p className="text-xs text-muted-foreground">
            The Telegram chat where the message will be sent.
          </p>
        </div> */}

        {/* Message */}
        <div className="space-y-2">
          <Label>Message</Label>

          <InputOrTextareaWithVariablesSupport
            type="textarea"
            value={config.message ?? ""}
            onValueChange={(value) =>
              onConfigChange({
                ...config,
                message: value,
              })
            }
            placeholder="Automation completed successfully."
            rows={3}
          />
        </div>
      </div>

      {/* Add Telegram Bot Modal */}
      <Dialog
        open={showAddBotModal}
        onOpenChange={handleModalChange}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Add Telegram Bot
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">
                Create bot
              </TabsTrigger>

              <TabsTrigger value="connect">
                Connect bot
              </TabsTrigger>
            </TabsList>

            {/* CREATE BOT */}
            <TabsContent
              value="create"
              className="mt-6"
            >
              <ScrollArea>
                <Timeline className="h-[25rem]">
                  {/* STEP 1 */}
                  <TimelineItem>
                    <TimelineHeader>
                      <TimelineTitle className="flex items-center gap-3">
                        Go to{" "}
                        <Link
                          href="https://web.telegram.org/k/#@BotFather"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex gap-2"
                        >
                          <span className="font-medium text-primary underline">
                            @BotFather
                          </span>
                        </Link>
                      </TimelineTitle>
                    </TimelineHeader>

                    <TimelineContent>
                      <p className="text-sm text-muted-foreground">
                        Open Telegram and start a conversation with
                        Telegram&apos;s official bot management bot.
                      </p>
                    </TimelineContent>
                  </TimelineItem>

                  {/* STEP 2 */}
                  <TimelineItem>
                    <TimelineHeader>
                      <TimelineTitle>
                        Type{" "}
                        <span className="font-mono text-xs">
                          /newbot
                        </span>
                      </TimelineTitle>
                    </TimelineHeader>

                    <TimelineContent>
                      <p className="text-sm text-muted-foreground">
                        Send the{" "}
                        <span className="font-mono text-xs">
                          /newbot
                        </span>{" "}
                        command to BotFather.
                      </p>
                    </TimelineContent>
                  </TimelineItem>

                  {/* STEP 3 */}
                  <TimelineItem>
                    <TimelineHeader>
                      <TimelineTitle>
                        Choose a name for your bot
                      </TimelineTitle>
                    </TimelineHeader>

                    <TimelineContent>
                      <div className="space-y-2">
                        <Label>Bot name</Label>

                        <Input
                          value={botName}
                          onChange={(e) =>
                            setBotName(e.target.value)
                          }
                          placeholder="My Automatio Bot"
                        />

                        <p className="text-xs text-muted-foreground">
                          This is the display name people will see
                          for your bot.
                        </p>
                      </div>
                    </TimelineContent>
                  </TimelineItem>

                  {/* STEP 4 */}
                  <TimelineItem>
                    <TimelineHeader>
                      <TimelineTitle>
                        Choose a username
                      </TimelineTitle>
                    </TimelineHeader>

                    <TimelineContent>
                      <p className="text-sm text-muted-foreground">
                        Choose a unique username for your bot.
                        Telegram bot usernames must end with{" "}
                        <span className="font-mono text-xs">
                          bot
                        </span>
                        .
                      </p>

                      <p className="mt-2 text-sm text-muted-foreground">
                        Example:{" "}
                        <span className="font-mono text-xs">
                          my_automatio_bot
                        </span>
                      </p>
                    </TimelineContent>
                  </TimelineItem>

                  {/* STEP 5 */}
                  <TimelineItem>
                    <TimelineHeader>
                      <TimelineTitle>
                        Copy your bot token
                      </TimelineTitle>
                    </TimelineHeader>

                    <TimelineContent>
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          BotFather will send you a message containing
                          your bot token. Copy it and paste it below.
                        </p>

                        <div className="space-y-2">
                          <Label>Bot token</Label>

                          <Input
                            type="password"
                            value={createBotToken}
                            onChange={(e) =>
                              setCreateBotToken(e.target.value)
                            }
                            placeholder="123456789:AA..."
                          />

                          <Image
                            src="/app/integrations/telegram/telegram-final-message-while-creating-bot.png"
                            width={500}
                            height={500}
                            alt="Telegram BotFather final message containing the bot token"
                            className="w-full rounded-lg"
                          />
                        </div>
                      </div>
                    </TimelineContent>
                  </TimelineItem>

                  {/* STEP 6 */}
                  <TimelineItem>
                    <TimelineHeader>
                      <TimelineTitle>
                        Open your bot in Telegram
                      </TimelineTitle>
                    </TimelineHeader>

                    <TimelineContent>
                      <p className="text-sm text-muted-foreground">
                        Search for the username you gave your bot and
                        open the conversation with it.
                      </p>
                    </TimelineContent>
                  </TimelineItem>

                 {/* STEP 7 */}
<TimelineItem>
  <TimelineHeader>
    <TimelineTitle>
      Click Start, then send{" "}
      <span className="font-mono text-xs">
        hello
      </span>
    </TimelineTitle>
  </TimelineHeader>

  <TimelineContent>
    <p className="text-sm text-muted-foreground">
      Open your bot in Telegram, click{" "}
      <span className="font-mono text-xs">
        Start
      </span>
      , then send{" "}
      <span className="font-mono text-xs">
        hello
      </span>
      . This creates a message that Telegram includes in
      the bot&apos;s updates.
    </p>
  </TimelineContent>
</TimelineItem>

                  {/* STEP 8 */}
                  <TimelineItem>
                    <TimelineHeader>
                      <TimelineTitle>
                        Find your Chat ID
                      </TimelineTitle>
                    </TimelineHeader>

                    <TimelineContent>
                      <div className="space-y-3">
                        <p className="text-sm text-muted-foreground">
                          Open this URL in your browser, replacing{" "}
                          <span className="font-mono text-xs">
                            YOUR_BOT_TOKEN
                          </span>{" "}
                          with the token you copied from BotFather:
                        </p>

                        <div className="rounded-md border bg-muted p-3">
                          <code className="break-all text-xs">
                            https://api.telegram.org/bot{createBotToken ? createBotToken: "YOUR_BOT_TOKEN"}/getUpdates
                          </code>
                        </div>

                        <p className="text-sm text-muted-foreground">
                          Find{" "}
                          <span className="font-mono text-xs">
                            message.chat.id
                          </span>{" "}
                          in the response. The number next to it is
                          your Chat ID.
                        </p>
                      </div>
                    </TimelineContent>
                  </TimelineItem>

                  {/* STEP 9 */}
                  <TimelineItem>
                    <TimelineHeader>
                      <TimelineTitle>
                        Enter your Chat ID
                      </TimelineTitle>
                    </TimelineHeader>

                    <TimelineContent>
                      <div className="space-y-2">
                        <Label>Chat ID</Label>

                        <Input
                          value={createChatId}
                          onChange={(e) =>
                            setCreateChatId(e.target.value)
                          }
                          placeholder="123456789"
                        />

                        <p className="text-xs text-muted-foreground">
                          Enter the number from{" "}
                          <span className="font-mono">
                            message.chat.id
                          </span>
                          .
                        </p>
                      </div>
                    </TimelineContent>
                  </TimelineItem>

                  {/* STEP 10 */}
                  <TimelineItem>
                    <TimelineHeader>
                      <TimelineTitle>
                        Connect it to Automatio
                      </TimelineTitle>
                    </TimelineHeader>

                    <TimelineContent>
                      {createBotError && (
                        <p className="mb-3 text-sm text-destructive">
                          {createBotError}
                        </p>
                      )}

                      <button
                        type="button"
                        disabled={
                          creatingBot ||
                          !botName.trim() ||
                          !createBotToken.trim() ||
                          !createChatId.trim()
                        }
                        onClick={handleCreateBot}
                        className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity disabled:pointer-events-none disabled:opacity-50"
                      >
                        {creatingBot
                          ? "Connecting..."
                          : "Connect Telegram bot"}
                      </button>
                    </TimelineContent>
                  </TimelineItem>
                </Timeline>
              </ScrollArea>
            </TabsContent>

            {/* CONNECT EXISTING BOT */}
            <TabsContent
              value="connect"
              className="mt-6"
            >
              <ScrollArea>
                <div className="h-[25rem] space-y-6 pr-4">
                  <div>
                    <h2 className="text-lg font-semibold">
                      Connect your existing bot
                    </h2>

                    <p className="mt-1 text-sm text-muted-foreground">
                      Enter the details for a Telegram bot you already
                      created.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Bot name</Label>

                    <Input
                      value={connectBotName}
                      onChange={(e) =>
                        setConnectBotName(e.target.value)
                      }
                      placeholder="My Telegram Bot"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Bot token</Label>

                    <Input
                      type="password"
                      value={connectBotToken}
                      onChange={(e) =>
                        setConnectBotToken(e.target.value)
                      }
                      placeholder="123456789:AA..."
                    />

                    <p className="text-xs text-muted-foreground">
                      You can find this token in the message BotFather
                      sent you when you created the bot.
                    </p>
                  </div>

                  <div className="rounded-md border p-4">
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        How to find your Chat ID
                      </p>

                      <ol className="list-inside list-decimal space-y-2 text-sm text-muted-foreground">
                        <li>
                          Open your bot in Telegram.
                        </li>

                        <li>
                          Click{" "}
                          <span className="font-mono text-xs">
                            Start
                          </span>{" "}
                          to the bot.
                        </li>
                        <li>
                          Send{" "}
                          <span className="font-mono text-xs">
                            hello
                          </span>{" "}
                          to the bot.
                        </li>

                        <li>
                          Open:
                          <div className="mt-2 rounded-md bg-muted p-2">
                            <code className="break-all text-xs">
                              https://api.telegram.org/bot{connectBotToken ? connectBotToken: "YOUR_BOT_TOKEN"}/getUpdates 
                            </code> 
                          </div> 
                        </li> 
 
                        <li> 
                          Find{" "} 
                          <span className="font-mono text-xs"> 
                            message.chat.id 
                          </span>{" "} 
                          in the response. 
                        </li> 
                      </ol> 
                    </div> 
                  </div> 
 
                  <div className="space-y-2"> 
                    <Label>Chat ID</Label> 
 
                    <Input 
                      value={connectChatId} 
                      onChange={(e) => 
                        setConnectChatId(e.target.value) 
                      } 
                      placeholder="123456789" 
                    /> 
 
                    <p className="text-xs text-muted-foreground"> 
                      Enter the Chat ID where Automatio should send 
                      messages. 
                    </p> 
                  </div> 
 
                  {connectBotError && ( 
                    <p className="text-sm text-destructive"> 
                      {connectBotError} 
                    </p> 
                  )} 
 
                  <button 
                    type="button" 
                    disabled={ 
                      connectingBot || 
                      !connectBotToken.trim() || 
                      !connectChatId.trim() 
                    } 
                    onClick={handleConnectBot} 
                    className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity disabled:pointer-events-none disabled:opacity-50" 
                  > 
                    {connectingBot 
                      ? "Connecting..." 
                      : "Connect Telegram bot"} 
                  </button> 
                </div> 
              </ScrollArea> 
            </TabsContent> 
          </Tabs> 
        </DialogContent> 
      </Dialog> 
    </> 
  ); 
}