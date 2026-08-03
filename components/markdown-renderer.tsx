'use client';

import React from 'react';
import { Streamdown } from 'streamdown';
import type { Components, ExtraProps } from 'streamdown';
import type { JSX } from 'react';
import { CodeBlock } from './code-block';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

type CodeComponentProps = JSX.IntrinsicElements['code'] & ExtraProps & { inline?: boolean };

const streamdownComponents: Components = {
  code({ inline, className, children, ...props }: CodeComponentProps) {
    const match = /language-(\w+)/.exec(className || '');
    const codeContent = Array.isArray(children) ? children.join('') : String(children || '');
    const isInline = inline || (!match && !codeContent.includes('\n'));

    if (isInline) {
      return (
        <code
          className="rounded-md bg-muted px-2 py-0.5 font-mono text-sm text-foreground border border-border/50"
          {...props}
        >
          {children}
        </code>
      );
    }

    return <CodeBlock language={match ? match[1] : ''} value={codeContent.replace(/\n$/, '')} />;
  },
  pre({ children }: JSX.IntrinsicElements['pre'] & ExtraProps) {
    return <>{children}</>;
  },
};

export const MarkdownRenderer = React.memo(function MarkdownRenderer({
  content,
  isStreaming = false,
}: MarkdownRendererProps) {
  return (
    <div className="prose prose-base dark:prose-invert max-w-none text-base leading-relaxed">
      <Streamdown
        isAnimating={isStreaming}
        controls={{ code: false }}
        components={streamdownComponents}
      >
        {content}
      </Streamdown>
    </div>
  );
});
