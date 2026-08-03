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
      <div className="flex items-center gap-2.5 shrink-0">
        {/* Model Selection Group */}
        <div className="flex items-center gap-2 bg-card border border-border/80 rounded-xl p-1.5 shadow-xs">
          <ModelSelector selectedModelIds={selectedModelIds} onToggleModel={onToggleModel} />
          <Badge
            variant="secondary"
            className="h-10 px-3 text-xs font-semibold rounded-lg bg-secondary text-secondary-foreground border border-border/50 flex items-center justify-center shrink-0"
          >
            {selectedModelIds.length} active
          </Badge>
        </div>

        {/* Global Execution Actions Group */}
        <div className="flex items-center gap-2 bg-card border border-border/80 rounded-xl p-1.5 shadow-xs">
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  onClick={onStopAll}
                  className="h-10 px-3.5 text-sm font-medium text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive gap-2 rounded-lg"
                />
              }
            >
              <Square className="h-4 w-4 fill-current" />
              <span>Stop All</span>
            </TooltipTrigger>
            <TooltipContent>Stop all streaming model outputs</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant="outline"
                  onClick={onClearAll}
                  className="h-10 px-3.5 text-sm font-medium gap-2 rounded-lg hover:bg-muted"
                />
              }
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear All</span>
            </TooltipTrigger>
            <TooltipContent>Clear chat messages for all models</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </TooltipProvider>
  );
}
