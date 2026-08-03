'use client';

import { ModelSelector } from '@/components/model-selector';
import { Badge } from '@/components/ui/badge';

export function Toolbar({
  selectedModelIds,
  onToggleModel,
}: {
  selectedModelIds: string[];
  onToggleModel: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2.5 shrink-0">
      {/* Model Selection Group */}
      <ModelSelector selectedModelIds={selectedModelIds} onToggleModel={onToggleModel} />
      <Badge
        variant="secondary"
        className="h-10 px-3 text-xs font-semibold rounded-lg bg-secondary text-secondary-foreground border border-border/50 flex items-center justify-center shrink-0"
      >
        {selectedModelIds.length} active
      </Badge>
    </div>
  );
}
