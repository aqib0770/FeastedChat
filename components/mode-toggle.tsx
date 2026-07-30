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
    <div className="flex items-center p-1 bg-muted rounded-lg border gap-1">
      <Button
        variant={mode === 'compare' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('compare')}
        className="h-7 px-2.5 text-xs gap-1.5"
      >
        <Columns3 className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Compare</span>
      </Button>

      <Button
        variant={mode === 'timeline' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('timeline')}
        className="h-7 px-2.5 text-xs gap-1.5"
      >
        <Clock className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Timeline</span>
      </Button>
    </div>
  );
}
