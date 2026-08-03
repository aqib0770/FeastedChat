'use client';

import React from 'react';
import { ChevronDown, Check, Info } from 'lucide-react';
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
  const triggerLabel = isAllFocused
    ? 'All Questions'
    : (focusedTurn?.userMessage.content ?? firstPrompt);

  return (
    <div className="flex items-center gap-3 shrink-0 flex-wrap">
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground uppercase">Question</span>
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center justify-between gap-2.5 rounded-xl border border-border/80 bg-background/50 px-3.5 h-9 text-xs font-semibold text-foreground hover:bg-muted/60 transition-colors max-w-[200px]">
            <span className="truncate">{triggerLabel}</span>
            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[320px]">
            <div className="px-2 py-1.5 text-xs font-semibold tracking-wide text-muted-foreground">
              Questions
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onSelectTurn(null)}
              className={isAllFocused ? 'bg-accent font-semibold' : ''}
            >
              {isAllFocused ? (
                <Check className="h-3.5 w-3.5 shrink-0 mr-1.5" />
              ) : (
                <span className="w-5 shrink-0" aria-hidden />
              )}
              <span>All Questions</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <ScrollArea className="max-h-[40vh]">
              {turns.map((turn) => {
                const isFocused = focusedTurnIndex === turn.turnIndex;
                return (
                  <DropdownMenuItem
                    key={turn.id}
                    onClick={() => onSelectTurn(turn.turnIndex)}
                    className={isFocused ? 'bg-accent font-semibold' : ''}
                  >
                    {isFocused ? (
                      <Check className="h-3.5 w-3.5 shrink-0 mr-1.5" />
                    ) : (
                      <span className="w-5 shrink-0" aria-hidden />
                    )}
                    <span className="text-muted-foreground font-mono text-xs w-4 shrink-0 mr-1.5">
                      {turn.turnIndex + 1}
                    </span>
                    <span className="truncate">{turn.userMessage.content}</span>
                  </DropdownMenuItem>
                );
              })}
            </ScrollArea>
            <DropdownMenuSeparator />
            <div className="px-2 py-1.5 text-[10px] font-medium text-muted-foreground">
              {turns.length} Question{turns.length === 1 ? '' : 's'}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="hidden md:flex items-center gap-1.5 text-[11px] text-muted-foreground/80 font-medium">
        <Info className="h-3.5 w-3.5 text-muted-foreground" />
        <span>
          {isAllFocused
            ? 'Viewing all questions'
            : `Question ${focusedTurnIndex + 1} of ${turns.length}`}
        </span>
      </div>
    </div>
  );
}
