'use client';
import React from 'react';
import { Streamdown } from 'streamdown';
import { code } from '@streamdown/code';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

export const MarkdownRenderer = React.memo(function MarkdownRenderer({
  content,
  isStreaming = false,
}: MarkdownRendererProps) {
  return (
    <div className="prose prose-sm prose-invert max-w-none prose-pre:p-0 prose-pre:bg-transparent">
      <Streamdown isAnimating={isStreaming} plugins={{ code }}>
        {content}
      </Streamdown>
    </div>
  );
});
