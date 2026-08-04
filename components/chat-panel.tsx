'use client';

import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useEffect,
  useState,
  useCallback,
} from 'react';
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Message } from '@/components/message';
import type { ModelConfig, ChatPanelRef } from '@/types';
import type { StoredTurn } from '@/lib/conversation-utils';
import { Square, AlertCircle, X, Info } from 'lucide-react';

/** Persistence IDs passed alongside each message send */
export interface PersistenceIds {
  conversationId: string;
  turnId: string;
  responseId: string;
}

interface ChatPanelProps {
  modelConfig: ModelConfig;
  onRemove?: () => void;
  /** Pre-loaded messages for hydrating from DB */
  initialMessages?: Array<{
    id: string;
    role: 'user' | 'assistant';
    parts: Array<{ type: 'text'; text: string }>;
  }>;
  /** Unique chat ID scoped to conversation + model */
  chatId?: string;
  /** Current focused turn index for snapshot mode (null = full mode) */
  focusedTurnIndex?: number | null;
  /** All turns in the conversation for snapshot rendering */
  turns?: StoredTurn[];
  /** Enable mem0 memory layer */
  useMemory?: boolean;
}

/** Extract text content from a v7 UIMessage (uses parts array) */
const getMessageText = (message: {
  parts?: Array<{ type: string; text?: string }>;
  content?: string;
}): string => {
  if (message.parts) {
    return message.parts
      .filter((p) => p.type === 'text' && p.text)
      .map((p) => p.text!)
      .join('');
  }
  if (message.content) return message.content;
  return '';
};

export const ChatPanel = forwardRef<ChatPanelRef, ChatPanelProps>(
  (
    {
      modelConfig,
      onRemove,
      initialMessages,
      chatId,
      focusedTurnIndex = null,
      turns = [],
      useMemory = false,
    },
    ref
  ) => {
    // Track persistence IDs for the current stream
    const persistenceRef = useRef<PersistenceIds | null>(null);
    const useMemoryRef = useRef(useMemory);

    useEffect(() => {
      useMemoryRef.current = useMemory;
    }, [useMemory]);

    // Each panel gets its own useChat with a unique transport that sends the model ID
    const { messages, sendMessage, stop, setMessages, regenerate, status, error } = useChat({
      id: chatId ?? 'chat-' + modelConfig.id,
      transport: new DefaultChatTransport({
        api: '/api/chat',
        body: () => ({
          model: modelConfig.gatewayId,
          useMemory: useMemoryRef.current,
          ...(persistenceRef.current ?? {}),
        }),
      }),
    });

    // Hydrate with historical messages when panel mounts or conversation changes
    const hydrationKeyRef = useRef<string | null>(null);
    useEffect(() => {
      const key = chatId ?? modelConfig.id;
      if (initialMessages && initialMessages.length > 0 && hydrationKeyRef.current !== key) {
        hydrationKeyRef.current = key;
        setMessages(initialMessages as Parameters<typeof setMessages>[0]);
      }
    }, [chatId, modelConfig.id, initialMessages, setMessages]);

    const isStreaming = status === 'streaming' || status === 'submitted';

    const isStreamingRef = useRef(isStreaming);
    useEffect(() => {
      isStreamingRef.current = isStreaming;
    }, [isStreaming]);

    useImperativeHandle(
      ref,
      () => ({
        sendMessage: (content: string, persistence?: PersistenceIds) => {
          // Store persistence IDs for the transport body
          persistenceRef.current = persistence ?? null;
          sendMessage({ text: content });
        },
        clear: () => setMessages([]),
        reload: () => regenerate(),
        get isStreaming() {
          return isStreamingRef.current;
        },
      }),
      [sendMessage, setMessages, regenerate]
    );

    // Elapsed time tracking
    const [elapsedMs, setElapsedMs] = useState(0);
    const startTimeRef = useRef<number | null>(null);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      if (isStreaming) {
        if (startTimeRef.current === null) {
          startTimeRef.current = Date.now();
          setElapsedMs(0);
        }
        if (!intervalRef.current) {
          intervalRef.current = setInterval(() => {
            if (startTimeRef.current !== null) {
              setElapsedMs(Date.now() - startTimeRef.current);
            }
          }, 100);
        }
      } else {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        if (status === 'ready') {
          startTimeRef.current = null;
        }
      }

      return () => {
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }, [isStreaming, status]);

    // Copy a specific assistant message
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
    const handleCopyMessage = useCallback((message: (typeof messages)[number]) => {
      navigator.clipboard.writeText(getMessageText(message));
      setCopiedMessageId(message.id);
      setTimeout(() => setCopiedMessageId((id) => (id === message.id ? null : id)), 2000);
    }, []);

    // Regenerate a specific assistant message by truncating up to its preceding user message
    const handleRegenerateMessage = useCallback(
      (message: (typeof messages)[number]) => {
        const index = messages.findIndex((m) => m.id === message.id);
        if (index <= 0) return;
        setMessages(messages.slice(0, index));
        regenerate();
      },
      [messages, setMessages, regenerate]
    );

    // Auto-scroll
    const messagesEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, status, focusedTurnIndex]);

    // Determine snapshot mode content
    const isSnapshotMode = focusedTurnIndex !== null;
    const snapshotTurn = isSnapshotMode
      ? turns.find((t) => t.turnIndex === focusedTurnIndex)
      : null;
    const snapshotResponse = snapshotTurn
      ? snapshotTurn.responses.find((r) => r.modelId === modelConfig.id)
      : null;

    // Check if model was active in this turn
    const userMsgIndex = focusedTurnIndex !== null ? focusedTurnIndex * 2 : -1;
    const assistantMsgIndex = focusedTurnIndex !== null ? focusedTurnIndex * 2 + 1 : -1;

    const liveUserMsg =
      userMsgIndex >= 0 && userMsgIndex < messages.length ? messages[userMsgIndex] : null;
    const liveAssistantMsg =
      assistantMsgIndex >= 0 && assistantMsgIndex < messages.length
        ? messages[assistantMsgIndex]
        : null;

    const isModelActive =
      isSnapshotMode &&
      Boolean(
        snapshotResponse ||
        liveUserMsg ||
        (snapshotTurn && snapshotTurn.responses.some((r) => r.modelId === modelConfig.id))
      );

    const snapshotUserText =
      snapshotTurn?.userMessage?.content || (liveUserMsg ? getMessageText(liveUserMsg) : '');
    const snapshotAssistantText =
      snapshotResponse?.content || (liveAssistantMsg ? getMessageText(liveAssistantMsg) : '');

    const snapshotLiveId =
      liveAssistantMsg?.id ??
      (snapshotTurn ? `snapshot-${snapshotTurn.turnIndex}-${modelConfig.id}` : '');

    return (
      <Card className="flex flex-col h-full min-h-[520px] overflow-hidden border-1 border-border/80 rounded-2xl shadow-xs bg-card">
        <CardHeader className="flex-none px-5 border-b border-border/80  space-y-0">
          <TooltipProvider>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <h3 className="font-bold text-base sm:text-lg text-foreground tracking-tight">
                  {modelConfig.name}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                {isStreaming && (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8 rounded-lg text-destructive border-destructive/30"
                          onClick={stop}
                        />
                      }
                    >
                      <Square className="h-4 w-4 fill-current" />
                    </TooltipTrigger>
                    <TooltipContent>Stop generating</TooltipContent>
                  </Tooltip>
                )}
                {isStreaming && (
                  <div className="h-2.5 w-2.5 rounded-full bg-green-500 animate-pulse" />
                )}
                {(elapsedMs > 0 || isStreaming) && (
                  <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md border">
                    {(elapsedMs / 1000).toFixed(1)}s
                  </span>
                )}
                {onRemove && (
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                          onClick={onRemove}
                        />
                      }
                    >
                      <X className="h-4.5 w-4.5" />
                    </TooltipTrigger>
                    <TooltipContent>Remove panel</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
          </TooltipProvider>
        </CardHeader>

        <CardContent className="flex-1 overflow-hidden p-0 relative">
          <ScrollArea className="h-full">
            <div className="flex flex-col gap-5 p-5 min-w-0">
              {isSnapshotMode ? (
                isModelActive ? (
                  <>
                    {snapshotUserText && <Message role="user" content={snapshotUserText} />}
                    <Message
                      role="assistant"
                      content={snapshotAssistantText}
                      isStreaming={
                        isStreaming && focusedTurnIndex === Math.floor((messages.length - 1) / 2)
                      }
                      showActions
                      isCopied={copiedMessageId === snapshotLiveId}
                      onCopy={() => {
                        navigator.clipboard.writeText(snapshotAssistantText);
                        setCopiedMessageId(snapshotLiveId);
                        setTimeout(() => setCopiedMessageId(null), 2000);
                      }}
                    />
                  </>
                ) : (
                  <>
                    {snapshotUserText && <Message role="user" content={snapshotUserText} />}
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/40 border border-dashed text-muted-foreground text-xs">
                      <Info className="h-3.5 w-3.5 shrink-0" />
                      <span>Model was not active for this turn.</span>
                    </div>
                  </>
                )
              ) : (
                messages.map((message) => (
                  <Message
                    key={message.id}
                    role={message.role as 'user' | 'assistant'}
                    content={getMessageText(message)}
                    isStreaming={
                      isStreaming &&
                      message.id === messages[messages.length - 1]?.id &&
                      message.role === 'assistant'
                    }
                    showActions={message.role === 'assistant'}
                    isCopied={copiedMessageId === message.id}
                    onCopy={() => handleCopyMessage(message)}
                    onRegenerate={
                      !isSnapshotMode && message.role === 'assistant'
                        ? () => handleRegenerateMessage(message)
                        : undefined
                    }
                  />
                ))
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          {error && (
            <div className="absolute inset-x-0 bottom-0 bg-background/95 backdrop-blur border-t p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>An error occurred.</span>
              </div>
              <Button size="sm" variant="outline" onClick={() => regenerate()}>
                Retry
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
);

ChatPanel.displayName = 'ChatPanel';
