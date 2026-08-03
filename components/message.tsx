'use client';

import React from 'react';
import { MarkdownRenderer } from './markdown-renderer';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { RotateCcw, Copy, Check } from 'lucide-react';

interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  showActions?: boolean;
  isCopied?: boolean;
  onCopy?: () => void;
  onRegenerate?: () => void;
}

export function Message({
  role,
  content,
  isStreaming,
  showActions,
  isCopied,
  onCopy,
  onRegenerate,
}: MessageProps) {
  if (role === 'user') {
    return (
      <div className="ml-auto max-w-[85%] rounded-2xl bg-secondary/80 border border-border/60 px-5 py-3.5 shadow-xs">
        <div className="whitespace-pre-wrap text-base font-medium leading-relaxed text-foreground">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 overflow-hidden text-base leading-relaxed">
      {isStreaming && content === '' ? (
        <div className="flex h-7 items-center gap-2">
          <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-primary" />
          <span className="text-sm text-muted-foreground animate-pulse font-medium">
            Thinking...
          </span>
        </div>
      ) : (
        <MarkdownRenderer content={content} isStreaming={isStreaming} />
      )}

      {showActions && !isStreaming && (
        <TooltipProvider>
          <div className="flex items-center gap-1 pt-2">
            {onCopy && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg"
                      onClick={onCopy}
                    />
                  }
                >
                  {isCopied ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </TooltipTrigger>
                <TooltipContent>Copy response</TooltipContent>
              </Tooltip>
            )}
            {onRegenerate && (
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-lg"
                      onClick={onRegenerate}
                    />
                  }
                >
                  <RotateCcw className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>Regenerate response</TooltipContent>
              </Tooltip>
            )}
          </div>
        </TooltipProvider>
      )}
    </div>
  );
}
