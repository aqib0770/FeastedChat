import React from 'react';
import { cn } from '@/lib/utils';

export function LogoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={cn('h-6 w-6 text-emerald-500', className)}>
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {Array.from({ length: 6 }).map((_, i) => (
          <ellipse
            key={i}
            cx="12"
            cy="7.2"
            rx="2.6"
            ry="5.3"
            transform={`rotate(${i * 60} 12 12)`}
          />
        ))}
      </g>

      <circle cx="12" cy="12" r="1.8" fill="currentColor" />
    </svg>
  );
}
