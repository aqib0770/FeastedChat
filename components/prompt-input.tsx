'use client';

import { useState, useCallback, type KeyboardEvent } from 'react';
import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function PromptInput({
  onSend,
  isAnyStreaming,
  disabled = false,
}: {
  onSend: (content: string) => void;
  isAnyStreaming: boolean;
  disabled?: boolean;
}) {
  const [value, setValue] = useState('');

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const trimmed = value.trim();
        if (trimmed && !isAnyStreaming && !disabled) {
          onSend(trimmed);
          setValue('');
        }
      }
    },
    [value, isAnyStreaming, disabled, onSend]
  );

  const handleSend = () => {
    const trimmed = value.trim();
    if (trimmed && !isAnyStreaming && !disabled) {
      onSend(trimmed);
      setValue('');
    }
  };

  return (
    <div className="sticky bottom-0 p-4 bg-background/80 backdrop-blur-sm border-t">
      <div className="bg-background border rounded-xl p-4 flex items-end gap-2">
        <Textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            disabled ? 'Select at least one model to start...' : 'Send a message to all models...'
          }
          disabled={disabled}
          rows={1}
          className="border-0 shadow-none resize-none focus-visible:ring-0 min-h-[44px] max-h-[200px] p-3 flex-1"
        />
        <Button
          size="icon"
          className="rounded-full h-9 w-9 shrink-0"
          onClick={handleSend}
          disabled={disabled || !value.trim() || isAnyStreaming}
        >
          <ArrowUp className="h-4 w-4" />
          <span className="sr-only">Send</span>
        </Button>
      </div>
    </div>
  );
}
