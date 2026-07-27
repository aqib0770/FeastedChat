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
      <div className="ml-auto max-w-[85%] rounded-xl bg-muted/50 px-4 py-2.5">
        <div className="whitespace-pre-wrap text-sm">{content}</div>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0 overflow-hidden">
      {isStreaming && content === '' ? (
        <div className="flex h-6 items-center">
          <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        </div>
      ) : (
        <MarkdownRenderer content={content} isStreaming={isStreaming} />
      )}
    </div>
  );
}
