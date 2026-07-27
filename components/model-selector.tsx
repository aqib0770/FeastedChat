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
      <DropdownMenuTrigger render={<Button variant="outline" size="sm" className="gap-2" />}>
        <Plus className="h-4 w-4" />
        Add Model
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px]">
        {AVAILABLE_MODELS.map((model: ModelConfig) => {
          const isSelected = selectedModelIds.includes(model.id);
          return (
            <DropdownMenuItem
              key={model.id}
              onClick={() => onToggleModel(model.id)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <span>{model.name}</span>
                <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                  {model.provider}
                </Badge>
              </div>
              {isSelected && <Check className="h-4 w-4" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
