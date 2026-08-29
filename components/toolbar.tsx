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
    <div className="flex items-center gap-2 shrink-0">
      {}
      <ModelSelector selectedModelIds={selectedModelIds} onToggleModel={onToggleModel} />
      <Badge
        variant="outline"
        className="h-7 px-2.5 text-[11px] font-medium rounded-full bg-muted/40 text-foreground border border-border/60 flex items-center justify-center gap-1.5 shrink-0"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
        <span>{selectedModelIds.length} Active</span>
      </Badge>
    </div>
  );
}
