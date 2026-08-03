import * as React from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="flex h-14 items-center justify-between px-4 sm:px-6 border-b bg-background shrink-0 z-20">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="h-8 w-8" />
        <div className="flex items-center gap-2.5">
          <h1 className="font-bold text-lg tracking-tight text-foreground">FeastedChat</h1>
          <span className="text-xs sm:text-sm text-muted-foreground font-normal hidden sm:inline">
            | Multi-Model AI Comparison
          </span>
        </div>
      </div>
    </header>
  );
}
