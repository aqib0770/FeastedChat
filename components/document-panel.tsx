'use client';

import { Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DocumentPanelProps {
  useMemory: boolean;
  onToggleMemory: () => void;
}

export function DocumentPanel({ useMemory, onToggleMemory }: DocumentPanelProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 bg-card border border-border/80 rounded-xl p-1.5 shadow-xs shrink-0">
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant={useMemory ? 'default' : 'outline'}
                className={`h-10 px-3.5 text-sm font-medium gap-2 rounded-lg shrink-0 ${
                  useMemory ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : ''
                }`}
                onClick={onToggleMemory}
              />
            }
          >
            <Brain className="h-4 w-4" />
            <span>Memory {useMemory ? 'On' : 'Off'}</span>
          </TooltipTrigger>
          <TooltipContent>
            {useMemory
              ? 'Memory enabled — retains user context and facts'
              : 'Enable memory to retain context across messages'}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
