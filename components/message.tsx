'use client';

import React from 'react';
import { MarkdownRenderer } from './markdown-renderer';

interface MessageProps {
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
}

export function Message({ role, content, isStreaming }: MessageProps) {
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
    </div>
  );
}
