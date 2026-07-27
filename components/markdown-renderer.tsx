'use client';
import React from 'react';
import { Streamdown } from 'streamdown';
import { CodeBlock } from './code-block';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

export const MarkdownRenderer = React.memo(function MarkdownRenderer({
  content,
  isStreaming = false,
}: MarkdownRendererProps) {
  return (
    <div className="prose prose-sm prose-invert max-w-none">
      <Streamdown
        isAnimating={isStreaming}
        controls={{ code: false }}
        components={{
          code({ inline, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const codeContent = Array.isArray(children)
              ? children.join('')
              : String(children || '');
            const isInline = inline || (!match && !codeContent.includes('\n'));

            if (isInline) {
              return (
                <code
                  className="rounded bg-muted/80 px-1.5 py-0.5 font-mono text-xs text-foreground border border-border/40"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <CodeBlock language={match ? match[1] : ''} value={codeContent.replace(/\n$/, '')} />
            );
          },
          pre({ children }: any) {
            return <>{children}</>;
          },
        }}
      >
        {content}
      </Streamdown>
    </div>
  );
});
