import * as React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';

export function Header() {
  return (
    <header className="flex h-16 items-center px-6 border-b bg-background gap-3 shrink-0">
      <SidebarTrigger className="h-9 w-9" />
      <div className="flex items-center gap-3">
        <h1 className="font-bold text-xl tracking-tight text-foreground">FeastedChat</h1>
        <span className="text-sm font-medium text-muted-foreground hidden sm:inline border-l pl-3 border-border">
          Multi-Model AI Comparison
        </span>
      </div>
    </header>
  );
}
