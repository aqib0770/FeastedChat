'use client';

import React, { useState, useEffect } from 'react';
import { Filter, Check } from 'lucide-react';
import { getModelById, MAX_MODELS_PER_CONVERSATION } from '@/lib/models';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface ModelFilterProps {
  availableModelIds: string[];
  selectedModelIds: string[] | null;
  onSelectModels: (modelIds: string[] | null) => void;
  onLimitExceeded?: (message: string) => void;
}

export function ModelFilter({
  availableModelIds,
  selectedModelIds,
  onSelectModels,
  onLimitExceeded,
}: ModelFilterProps) {
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (localError) {
      const t = setTimeout(() => setLocalError(null), 3000);
      return () => clearTimeout(t);
    }
  }, [localError]);

  if (availableModelIds.length <= 1) return null;

  const isAll = selectedModelIds === null;
  const activeSet = new Set(selectedModelIds ?? []);

  const triggerLabel = (() => {
    if (isAll) return 'All Models';
    if (selectedModelIds!.length === 1)
      return getModelById(selectedModelIds![0])?.name || selectedModelIds![0];
    return `${selectedModelIds!.length} Models`;
  })();

  const handleToggleAll = () => {
    onSelectModels(null);
  };

  const handleToggleOne = (id: string) => {
    const wasSelected = activeSet.has(id);
    let next: string[] | null;

    if (isAll) {
      // From All, picking one means narrowing to that single model
      // For multi-select, starting from All and toggling off one means select all except that one.
      // We interpret toggle when All is active as: switch to All except `id` is deselected? No, simpler: isolate to that model.
      // To allow building a subset, treat first click from All as selecting only that model.
      next = [id];
    } else if (wasSelected) {
      const filtered = selectedModelIds!.filter((x) => x !== id);
      if (filtered.length === 0) {
        setLocalError('At least one model must remain');
        onLimitExceeded?.('At least one model must remain');
        return;
      }
      if (filtered.length === availableModelIds.length) {
        next = null;
      } else {
        next = filtered;
      }
    } else {
      if (selectedModelIds!.length >= MAX_MODELS_PER_CONVERSATION) {
        const msg = `You can filter at most ${MAX_MODELS_PER_CONVERSATION} models at a time`;
        setLocalError(msg);
        onLimitExceeded?.(msg);
        return;
      }
      const expanded = [...selectedModelIds!, id];
      if (expanded.length === availableModelIds.length) {
        next = null;
      } else {
        next = expanded;
      }
    }
    onSelectModels(next);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" className="gap-1.5 h-7 text-xs font-medium px-3 rounded-lg">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate max-w-[140px]">{triggerLabel}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-60 p-1">
        <DropdownMenuItem
          className="flex justify-between items-center cursor-pointer text-xs font-medium py-1.5 px-2 rounded-md"
          onClick={handleToggleAll}
        >
          <span>All Models</span>
          {isAll && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
        </DropdownMenuItem>

        <div className="h-px bg-border my-1" />

        {availableModelIds.map((id) => {
          const modelInfo = getModelById(id);
          const isSelected = isAll || activeSet.has(id);
          const wouldExceed =
            !isSelected &&
            selectedModelIds !== null &&
            selectedModelIds.length >= MAX_MODELS_PER_CONVERSATION;

          return (
            <DropdownMenuItem
              key={id}
              className={`flex justify-between items-center cursor-pointer text-xs font-medium py-1.5 px-2 rounded-md ${wouldExceed ? 'opacity-50' : ''}`}
              onClick={() => handleToggleOne(id)}
            >
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="truncate">{modelInfo?.name || id}</span>
                {modelInfo?.provider && (
                  <Badge
                    variant="outline"
                    className="text-[10px] w-fit px-1 py-0 h-3.5 font-normal"
                  >
                    {modelInfo.provider}
                  </Badge>
                )}
              </div>
              {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-2" />}
            </DropdownMenuItem>
          );
        })}
        {localError && <div className="px-2 py-1 text-[11px] text-destructive">{localError}</div>}
        {/*<div className="px-2 pt-1 text-[10px] text-muted-foreground">
          {isAll ? `${availableModelIds.length} models` : `${selectedModelIds!.length} of ${availableModelIds.length} selected`} · max {MAX_MODELS_PER_CONVERSATION}
        </div>*/}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Back-compat wrappers for any stray callers expecting old prop names
export type ModelFilterLegacyProps = {
  availableModelIds: string[];
  selectedModelId: string | null;
  onSelectModel: (id: string | null) => void;
};
