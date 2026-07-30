'use client';

import * as React from 'react';
import { Square, Trash2 } from 'lucide-react';
import { ModelSelector } from '@/components/model-selector';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function Toolbar({
  selectedModelIds,
  onToggleModel,
  onStopAll,
  onClearAll,
}: {
  selectedModelIds: string[];
  onToggleModel: (id: string) => void;
  onStopAll: () => void;
  onClearAll: () => void;
}) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <ModelSelector selectedModelIds={selectedModelIds} onToggleModel={onToggleModel} />
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                onClick={onStopAll}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive gap-2"
              />
            }
          >
            <Square className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Stop All</span>
          </TooltipTrigger>
          <TooltipContent>Stop all streams</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger
            render={<Button variant="outline" size="sm" onClick={onClearAll} className="gap-2" />}
          >
            <Trash2 className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Clear All</span>
          </TooltipTrigger>
          <TooltipContent>Clear all messages</TooltipContent>
        </Tooltip>
        <Badge variant="secondary">
          {selectedModelIds.length} model{selectedModelIds.length === 1 ? '' : 's'}
        </Badge>
      </div>
    </TooltipProvider>
  );
}
