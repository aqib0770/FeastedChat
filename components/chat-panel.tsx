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
import { Square, RotateCcw, Copy, Check, Trash2, AlertCircle } from 'lucide-react';

interface ChatPanelProps {
  modelConfig: ModelConfig;
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

export const ChatPanel = forwardRef<ChatPanelRef, ChatPanelProps>(({ modelConfig }, ref) => {
  // Each panel gets its own useChat with a unique transport that sends the model ID
  const { messages, sendMessage, stop, setMessages, regenerate, status, error } = useChat({
    id: 'chat-' + modelConfig.id,
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: { model: modelConfig.gatewayId },
    }),
  });

  const isStreaming = status === 'streaming' || status === 'submitted';

  useImperativeHandle(ref, () => ({
    sendMessage: (content: string) => sendMessage({ text: content }),
    stop,
    clear: () => setMessages([]),
    reload: () => regenerate(),
    isStreaming,
  }));

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

  // Copy last assistant message
  const [isCopied, setIsCopied] = useState(false);
  const handleCopy = useCallback(() => {
    const lastAssistantMessage = messages.filter((m) => m.role === 'assistant').pop();
    if (lastAssistantMessage) {
      navigator.clipboard.writeText(getMessageText(lastAssistantMessage));
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  }, [messages]);

  // Auto-scroll
  const messagesEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  return (
    <Card className="flex flex-col h-full min-h-[500px] overflow-hidden">
      <CardHeader className="flex-none py-3 px-4 border-b space-y-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">{modelConfig.name}</h3>
            <Badge variant="outline" className="text-xs">
              {modelConfig.provider}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {isStreaming && <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />}
            {(elapsedMs > 0 || isStreaming) && (
              <span className="text-xs text-muted-foreground">
                {(elapsedMs / 1000).toFixed(1)}s
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-1 mt-2">
          <TooltipProvider>
            {isStreaming && (
              <Tooltip>
                <TooltipTrigger
                  render={<Button variant="ghost" size="icon" className="h-7 w-7" onClick={stop} />}
                >
                  <Square className="h-3.5 w-3.5" />
                </TooltipTrigger>
                <TooltipContent>Stop generating</TooltipContent>
              </Tooltip>
            )}

            {!isStreaming && messages.length > 0 && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => regenerate()}
                    />
                  }
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </TooltipTrigger>
                <TooltipContent>Regenerate response</TooltipContent>
              </Tooltip>
            )}

            {messages.length > 0 && (
              <>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={handleCopy}
                      />
                    }
                  >
                    {isCopied ? (
                      <Check className="h-3.5 w-3.5 text-green-500" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </TooltipTrigger>
                  <TooltipContent>Copy last response</TooltipContent>
                </Tooltip>

                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => setMessages([])}
                      />
                    }
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </TooltipTrigger>
                  <TooltipContent>Clear messages</TooltipContent>
                </Tooltip>
              </>
            )}
          </TooltipProvider>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden p-0 relative">
        <ScrollArea className="h-full">
          <div className="flex flex-col gap-4 p-4">
            {messages.map((message) => (
              <Message
                key={message.id}
                role={message.role as 'user' | 'assistant'}
                content={getMessageText(message)}
                isStreaming={
                  isStreaming &&
                  message.id === messages[messages.length - 1]?.id &&
                  message.role === 'assistant'
                }
              />
            ))}
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
});

ChatPanel.displayName = 'ChatPanel';
