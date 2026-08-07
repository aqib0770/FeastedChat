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
        variant="outline"
        className="h-9 px-3 text-xs font-semibold rounded-xl bg-muted/40 text-foreground border border-border/80 flex items-center justify-center gap-2 shrink-0"
      >
        <span className="h-2 w-2 rounded-full bg-primary" />
        <span>{selectedModelIds.length} Active</span>
      </Badge>
    </div>
  );
}
