'use client';

import React, { useState, useEffect } from 'react';
import { Copy, Check } from 'lucide-react';
import { codeToHtml } from 'shiki';

interface CodeBlockProps {
  language: string;
  value: string;
}

export function CodeBlock({ language, value }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function highlight() {
      try {
        const html = await codeToHtml(value, {
          lang: language || 'text',
          theme: 'github-dark',
        });
        if (isMounted) {
          setHighlightedHtml(html);
        }
      } catch {
        try {
          const fallbackHtml = await codeToHtml(value, {
            lang: 'text',
            theme: 'github-dark',
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
  }, [value, language]);

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
    <div className="not-prose my-4 overflow-hidden rounded-lg border border-zinc-700/60 bg-[#1e1e1e] font-mono text-sm shadow-md">
      {/* ChatGPT / Claude style header bar */}
      <div className="flex items-center justify-between border-b border-zinc-700/50 bg-[#2d2d2d] px-4 py-1.5 text-xs text-zinc-400 select-none">
        <span className="font-sans font-medium text-zinc-300 lowercase">{displayLanguage}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded px-2 py-1 text-xs text-zinc-400 hover:bg-zinc-700/50 hover:text-zinc-100 transition-colors cursor-pointer"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span>Copy code</span>
            </>
          )}
        </button>
      </div>

      {/* Code content with horizontal scrollbar - single seamless background */}
      <div className="overflow-x-auto p-4 text-xs md:text-sm leading-relaxed text-zinc-100 bg-[#1e1e1e]">
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
