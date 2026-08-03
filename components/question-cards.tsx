'use client';

import React from 'react';
import { StoredTurn } from '@/lib/conversation-utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface QuestionCardsProps {
  turns: StoredTurn[];
  focusedTurnIndex: number | null;
  onSelectTurn: (turnIndex: number | null) => void;
}

export function QuestionCards({ turns, focusedTurnIndex, onSelectTurn }: QuestionCardsProps) {
  if (!turns || turns.length === 0) return null;

  return (
    <div className="w-full bg-background border-b py-3 px-6 sticky top-0 z-30 shrink-0">
      <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar">
        <Button
          variant={focusedTurnIndex === null ? 'default' : 'secondary'}
          onClick={() => onSelectTurn(null)}
          className="rounded-xl shrink-0 text-sm h-9 px-4 font-semibold shadow-xs"
        >
          Show All
        </Button>

        {turns.map((turn) => {
          const isFocused = focusedTurnIndex === turn.turnIndex;
          const prompt = turn.userMessage.content;
          const truncated = prompt.length > 55 ? prompt.slice(0, 55) + '...' : prompt;

          return (
            <Button
              key={turn.id}
              variant={isFocused ? 'outline' : 'ghost'}
              onClick={() => onSelectTurn(turn.turnIndex)}
              className={`rounded-xl shrink-0 text-sm h-9 px-3.5 gap-2 border font-medium transition-all ${
                isFocused
                  ? 'border-primary bg-primary/10 text-primary font-semibold shadow-xs'
                  : 'border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted/60'
              }`}
            >
              <Badge
                variant={isFocused ? 'default' : 'secondary'}
                className="text-xs px-2 py-0.5 h-5 rounded-md font-bold"
              >
                {turn.turnIndex + 1}
              </Badge>
              <span className="truncate max-w-[220px]">{truncated}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
