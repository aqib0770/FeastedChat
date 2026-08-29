'use client';

import React from 'react';
import { Filter, Check } from 'lucide-react';
import { getModelById } from '@/lib/models';
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
  selectedModelId: string | null;
  onSelectModel: (modelId: string | null) => void;
}

export function ModelFilter({
  availableModelIds,
  selectedModelId,
  onSelectModel,
}: ModelFilterProps) {
  if (availableModelIds.length <= 1) return null;

  const getModelName = (id: string | null) => {
    if (!id) return 'All Models';
    return getModelById(id)?.name || id;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" className="gap-1.5 h-7 text-xs font-medium px-3 rounded-lg">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate max-w-[140px]">{getModelName(selectedModelId)}</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="w-60 p-1">
        <DropdownMenuItem
          className="flex justify-between items-center cursor-pointer text-xs font-medium py-1.5 px-2 rounded-md"
          onClick={() => onSelectModel(null)}
        >
          <span>All Models</span>
          {selectedModelId === null && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
        </DropdownMenuItem>

        <div className="h-px bg-border my-1" />

        {availableModelIds.map((id) => {
          const modelInfo = getModelById(id);
          const isSelected = selectedModelId === id;

          return (
            <DropdownMenuItem
              key={id}
              className="flex justify-between items-center cursor-pointer text-xs font-medium py-1.5 px-2 rounded-md"
              onClick={() => onSelectModel(id)}
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
