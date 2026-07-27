import * as React from 'react';

export function Header() {
  return (
    <header className="flex h-14 items-center px-6 border-b">
      <h1 className="font-semibold text-lg">FeastedChat</h1>
      <span className="ml-2 text-sm text-muted-foreground">Multi-Model AI Comparison</span>
    </header>
  );
}
