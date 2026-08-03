'use client';

import React from 'react';
import { Columns3, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ModeToggleProps {
  mode: 'compare' | 'timeline';
  onModeChange: (mode: 'compare' | 'timeline') => void;
}

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <div className="flex items-center p-1 bg-muted/80 rounded-xl border border-border/60 gap-1 h-10">
      <Button
        variant={mode === 'compare' ? 'secondary' : 'ghost'}
        onClick={() => onModeChange('compare')}
        className={`h-8 px-3 text-sm gap-2 font-medium rounded-lg ${
          mode === 'compare'
            ? 'bg-background shadow-xs text-foreground font-semibold'
            : 'text-muted-foreground'
        }`}
      >
        <Columns3 className="h-4 w-4" />
        <span className="hidden sm:inline">Compare</span>
      </Button>

      <Button
        variant={mode === 'timeline' ? 'secondary' : 'ghost'}
        onClick={() => onModeChange('timeline')}
        className={`h-8 px-3 text-sm gap-2 font-medium rounded-lg ${
          mode === 'timeline'
            ? 'bg-background shadow-xs text-foreground font-semibold'
            : 'text-muted-foreground'
        }`}
      >
        <Clock className="h-4 w-4" />
        <span className="hidden sm:inline">Timeline</span>
      </Button>
    </div>
  );
}
