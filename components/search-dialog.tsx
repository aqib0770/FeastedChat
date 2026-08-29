'use client';

/* eslint-disable react-hooks/set-state-in-effect -- debounced remote search needs sync reset */

import * as React from 'react';
import { Search, Loader2, MessageSquare, Sparkles } from 'lucide-react';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import type { SearchResult } from '@/lib/conversation-utils';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (conversationId: string, turnIndex: number | null) => void;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function HighlightedSnippet({ snippet, query }: { snippet: string; query: string }) {
  if (!query || query.length < 2) return <>{snippet}</>;
  const escaped = escapeRegExp(query);
  const parts = snippet.split(new RegExp(`(${escaped})`, 'gi'));
  const lowerQuery = query.toLowerCase();
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === lowerQuery ? (
          <mark
            key={i}
            className="bg-yellow-200 dark:bg-yellow-500/30 text-foreground rounded-[2px] px-0.5"
          >
            {part}
          </mark>
        ) : (
          <React.Fragment key={i}>{part}</React.Fragment>
        )
      )}
    </>
  );
}

function formatUpdatedAt(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString();
}

export function SearchDialog({ open, onOpenChange, onSelect }: SearchDialogProps) {
  const [query, setQuery] = React.useState('');
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasSearched, setHasSearched] = React.useState(false);

  // Debounced query
  const [debouncedQuery, setDebouncedQuery] = React.useState('');
  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 250);
    return () => clearTimeout(t);
  }, [query]);

  // Reset when dialog closes
  React.useEffect(() => {
    if (!open) {
      // small delay so closing animation isn't jarring
      const t = setTimeout(() => {
        setQuery('');
        setDebouncedQuery('');
        setResults([]);
        setHasSearched(false);
        setIsLoading(false);
      }, 150);
      return () => clearTimeout(t);
    }
  }, [open]);

  React.useEffect(() => {
    if (!open) return;
    if (debouncedQuery.length < 2) {
      setResults([]);
      setHasSearched(false);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    setHasSearched(true);

    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`, {
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Search failed');
        const data = (await res.json()) as SearchResult[];
        if (!controller.signal.aborted) {
          setResults(data);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.error('Search error:', err);
          if (!controller.signal.aborted) setResults([]);
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [debouncedQuery, open]);

  const handleSelectValue = React.useCallback(
    (conversationId: string, turnIndex: number | null) => {
      onSelect(conversationId, turnIndex);
      onOpenChange(false);
    },
    [onSelect, onOpenChange]
  );

  const showHint = debouncedQuery.length < 2 && query.length < 2;
  const showEmpty = hasSearched && !isLoading && results.length === 0 && debouncedQuery.length >= 2;
  const totalMatches = results.reduce((acc, r) => acc + r.matches.length, 0);

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search chats"
      description="Search through your chat history"
      className="sm:max-w-[640px] max-w-[640px] top-[20%] translate-y-0"
    >
      <Command shouldFilter={false} className="rounded-xl">
        <CommandInput placeholder="Search chats..." value={query} onValueChange={setQuery} />
        <CommandList className="max-h-[420px]">
          {isLoading && (
            <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching...
            </div>
          )}

          {!isLoading && showHint && (
            <div className="py-8 text-center">
              <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                <Search className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">Search your chats</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Search titles, prompts, and AI responses. Type at least 2 characters.
              </p>
              <p className="mt-3 text-[11px] text-muted-foreground/60">
                Press ESC to close · Ctrl+K to open
              </p>
            </div>
          )}

          {!isLoading && showEmpty && (
            <CommandEmpty className="py-8">
              <div className="flex flex-col items-center gap-2">
                <Search className="h-5 w-5 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">
                  No chats found for “{debouncedQuery}”
                </p>
                <p className="text-xs text-muted-foreground/60">Try a different keyword</p>
              </div>
            </CommandEmpty>
          )}

          {!isLoading && results.length > 0 && (
            <>
              <div className="px-3 py-2 text-[11px] font-medium text-muted-foreground">
                {results.length} conversation{results.length !== 1 ? 's' : ''} · {totalMatches}{' '}
                match
                {totalMatches !== 1 ? 'es' : ''}
              </div>
              {results.map((conv) => (
                <CommandGroup
                  key={conv.id}
                  heading={
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate font-medium">
                        {conv.title || 'Untitled Conversation'}
                      </span>
                      <span className="shrink-0 text-[11px] font-normal text-muted-foreground/60">
                        {formatUpdatedAt(conv.updatedAt)}
                      </span>
                    </span>
                  }
                >
                  {conv.matches.map((match, idx) => {
                    const value = `${conv.id}-${match.kind}-${match.turnIndex ?? 'title'}-${idx}`;
                    const Icon =
                      match.kind === 'user'
                        ? MessageSquare
                        : match.kind === 'assistant'
                          ? Sparkles
                          : Search;
                    const kindLabel =
                      match.kind === 'user'
                        ? 'You'
                        : match.kind === 'assistant'
                          ? (match.modelId ?? 'Assistant')
                          : 'Title';
                    return (
                      <CommandItem
                        key={value}
                        value={value}
                        onSelect={() => handleSelectValue(conv.id, match.turnIndex)}
                        className="flex flex-col items-start gap-1 rounded-lg px-3 py-2.5 data-[selected=true]:bg-accent"
                      >
                        <div className="flex w-full items-center gap-1.5">
                          <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="text-[11px] font-medium text-muted-foreground">
                            {kindLabel}
                          </span>
                          {match.turnIndex !== null && (
                            <span className="text-[11px] text-muted-foreground/60">
                              · Prompt #{match.turnIndex + 1}
                            </span>
                          )}
                        </div>
                        <span className="w-full truncate text-left text-[13px] leading-5 text-foreground/90">
                          <HighlightedSnippet snippet={match.snippet} query={debouncedQuery} />
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ))}
            </>
          )}
        </CommandList>
        <div className="border-t px-3 py-2 text-[11px] text-muted-foreground/60">
          <span className="hidden sm:inline">↑↓ Navigate · Enter to open · Esc to close</span>
          <span className="sm:hidden">Tap a result to open</span>
        </div>
      </Command>
    </CommandDialog>
  );
}
