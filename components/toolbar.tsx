'use client';

import { ModelSelector } from '@/components/model-selector';

export function Toolbar({
  selectedModelIds,
  onToggleModel,
}: {
  selectedModelIds: string[];
  onToggleModel: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 shrink-0">
      {}
      <ModelSelector selectedModelIds={selectedModelIds} onToggleModel={onToggleModel} />
    </div>
  );
}
