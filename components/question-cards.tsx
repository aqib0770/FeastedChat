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
    <div className="w-full bg-background/95 backdrop-blur border-b py-2.5 px-4 sticky top-0 z-30">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        <Button
          size="sm"
          variant={focusedTurnIndex === null ? 'default' : 'secondary'}
          onClick={() => onSelectTurn(null)}
          className="rounded-full shrink-0 text-xs h-7"
        >
          Show All
        </Button>

        {turns.map((turn) => {
          const isFocused = focusedTurnIndex === turn.turnIndex;
          const prompt = turn.userMessage.content;
          const truncated = prompt.length > 50 ? prompt.slice(0, 50) + '...' : prompt;

          return (
            <Button
              key={turn.id}
              size="sm"
              variant={isFocused ? 'outline' : 'ghost'}
              onClick={() => onSelectTurn(turn.turnIndex)}
              className={`rounded-full shrink-0 text-xs h-7 gap-1.5 border ${
                isFocused
                  ? 'border-primary bg-primary/10 font-medium'
                  : 'border-border text-muted-foreground hover:text-foreground'
              }`}
            >
              <Badge
                variant={isFocused ? 'default' : 'secondary'}
                className="text-[10px] px-1.5 py-0 h-4 rounded-full"
              >
                {turn.turnIndex + 1}
              </Badge>
              <span className="truncate max-w-[180px]">{truncated}</span>
            </Button>
          );
        })}
      </div>
    </div>
  );
}
