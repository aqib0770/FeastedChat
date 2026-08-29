'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { useTheme } from 'next-themes';
import { codeToHtml } from 'shiki';

interface CodeBlockProps {
  language: string;
  value: string;
}

export function CodeBlock({ language, value }: CodeBlockProps) {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== 'light';
  const theme = isDark ? 'github-dark' : 'github-light';

  const [copied, setCopied] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function highlight() {
      try {
        const html = await codeToHtml(value, {
          lang: language || 'text',
          theme,
        });
        if (isMounted) {
          setHighlightedHtml(html);
        }
      } catch {
        try {
          const fallbackHtml = await codeToHtml(value, {
            lang: 'text',
            theme,
          });
          if (isMounted) {
            setHighlightedHtml(fallbackHtml);
          }
        } catch {
          if (isMounted) setHighlightedHtml(null);
        }
      }
    }

    highlight();

    return () => {
      isMounted = false;
    };
  }, [value, language, theme]);

  const handleCopy = async () => {
    if (!value) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = value;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code block:', err);
    }
  };

  const languageNames: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    tsx: 'tsx',
    jsx: 'jsx',
    py: 'python',
    sh: 'bash',
    bash: 'bash',
    zsh: 'bash',
    yml: 'yaml',
    rs: 'rust',
    cs: 'c#',
    cpp: 'c++',
    rb: 'ruby',
    go: 'go',
    html: 'html',
    css: 'css',
    json: 'json',
    sql: 'sql',
    md: 'markdown',
  };
  const normalizedLang = language ? language.toLowerCase() : '';
  const displayLanguage = languageNames[normalizedLang] || normalizedLang || 'code';

  return (
    <div className="not-prose my-3 overflow-hidden rounded-md border border-border bg-card font-mono text-[13px] shadow-none">
      {}
      <div className="flex items-center justify-between border-b border-border/60 bg-muted px-3 py-1 text-[11px] text-muted-foreground select-none">
        <span className="font-sans font-medium text-foreground lowercase">{displayLanguage}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-colors cursor-pointer"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-primary" />
              <span className="text-primary font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {}
      <div className="overflow-x-auto p-3 text-xs leading-5 text-foreground bg-background">
        {highlightedHtml ? (
          <div
            className="[&>pre]:!bg-transparent [&>pre]:!m-0 [&>pre]:!p-0 [&>pre]:!border-0 [&>pre]:!shadow-none [&>pre]:overflow-x-auto [&>pre]:whitespace-pre [&>pre]:font-mono [&_code]:font-mono"
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        ) : (
          <pre className="m-0 p-0 overflow-x-auto whitespace-pre font-mono bg-transparent">
            <code>{value}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
