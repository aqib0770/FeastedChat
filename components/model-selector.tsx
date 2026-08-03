'use client';

import * as React from 'react';
import { Plus, Check } from 'lucide-react';
import { AVAILABLE_MODELS } from '@/lib/models';
import { type ModelConfig } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function ModelSelector({
  selectedModelIds,
  onToggleModel,
}: {
  selectedModelIds: string[];
  onToggleModel: (id: string) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="default" className="h-10 px-3.5 text-sm font-semibold gap-2 shadow-xs" />
        }
      >
        <Plus className="h-4.5 w-4.5" />
        <span>Add Model</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[260px] p-1.5">
        {AVAILABLE_MODELS.map((model: ModelConfig) => {
          const isSelected = selectedModelIds.includes(model.id);
          return (
            <DropdownMenuItem
              key={model.id}
              onClick={() => onToggleModel(model.id)}
              className="flex items-center justify-between cursor-pointer py-2 px-2.5 text-sm font-medium rounded-md"
            >
              <div className="flex items-center gap-2">
                <span>{model.name}</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 font-normal">
                  {model.provider}
                </Badge>
              </div>
              {isSelected && <Check className="h-4 w-4 text-primary shrink-0 ml-2" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
