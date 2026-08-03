'use client';

import React from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { StoredTurn } from '@/lib/conversation-utils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

interface QuestionCardsProps {
  turns: StoredTurn[];
  focusedTurnIndex: number | null;
  onSelectTurn: (turnIndex: number | null) => void;
}

export function QuestionCards({ turns, focusedTurnIndex, onSelectTurn }: QuestionCardsProps) {
  if (!turns || turns.length === 0) return null;

  const firstPrompt = turns[0].userMessage.content;
  const isAllFocused = focusedTurnIndex === null;
  const focusedTurn = turns.find((t) => t.turnIndex === focusedTurnIndex);
  const triggerLabel = isAllFocused ? 'All' : (focusedTurn?.userMessage.content ?? firstPrompt);

  return (
    <div className="w-full bg-background border-b py-3 px-6 sticky top-0 z-30 shrink-0">
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Questions
        </span>
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-xl border border-border/60 px-3.5 h-9 text-sm font-medium text-foreground hover:bg-muted/60 transition-colors max-w-full">
            <span className="truncate max-w-[280px]">{triggerLabel}</span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[320px]">
            <div className="px-2 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground">
              Questions
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onSelectTurn(null)}
              className={isAllFocused ? 'bg-primary/10 font-semibold' : ''}
            >
              {isAllFocused ? (
                <Check className="shrink-0" />
              ) : (
                <span className="w-3.5 shrink-0" aria-hidden />
              )}
              <span>All</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <ScrollArea className="max-h-[40vh]">
              {turns.map((turn) => {
                const isFocused = focusedTurnIndex === turn.turnIndex;
                return (
                  <DropdownMenuItem
                    key={turn.id}
                    onClick={() => onSelectTurn(turn.turnIndex)}
                    className={isFocused ? 'bg-primary/10 font-semibold' : ''}
                  >
                    {isFocused ? (
                      <Check className="shrink-0" />
                    ) : (
                      <span className="w-3.5 shrink-0" aria-hidden />
                    )}
                    <span className="text-muted-foreground font-mono text-xs w-4 shrink-0">
                      {turn.turnIndex + 1}
                    </span>
                    <span className="truncate">{turn.userMessage.content}</span>
                  </DropdownMenuItem>
                );
              })}
            </ScrollArea>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
              {turns.length} Question{turns.length === 1 ? '' : 's'}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
