import * as React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';

export function Header() {
  return (
    <header className="flex h-14 items-center px-4 border-b gap-3">
      <SidebarTrigger />
      <div className="flex items-center gap-2">
        <h1 className="font-semibold text-base">FeastedChat</h1>
        <span className="text-xs text-muted-foreground hidden sm:inline">
          Multi-Model AI Comparison
        </span>
      </div>
    </header>
  );
}
