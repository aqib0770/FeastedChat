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
    <div className="flex items-center p-0.5 bg-muted/80 rounded-lg border border-border/60 gap-0.5 h-8">
      <Button
        variant={mode === 'compare' ? 'secondary' : 'ghost'}
        onClick={() => onModeChange('compare')}
        className={`h-7 px-2.5 text-xs gap-1.5 font-medium rounded-md ${
          mode === 'compare'
            ? 'bg-background shadow-none text-foreground font-semibold'
            : 'text-muted-foreground'
        }`}
      >
        <Columns3 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Compare</span>
      </Button>

      <Button
        variant={mode === 'timeline' ? 'secondary' : 'ghost'}
        onClick={() => onModeChange('timeline')}
        className={`h-7 px-2.5 text-xs gap-1.5 font-medium rounded-md ${
          mode === 'timeline'
            ? 'bg-background shadow-none text-foreground font-semibold'
            : 'text-muted-foreground'
        }`}
      >
        <Clock className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Timeline</span>
      </Button>
    </div>
  );
}
