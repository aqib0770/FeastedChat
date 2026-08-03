'use client';

import { FileText, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { StoredDocument } from '@/types';

interface DocumentPanelProps {
  documents: StoredDocument[];
  useRag: boolean;
  onToggleRag: () => void;
  useMemory: boolean;
  onToggleMemory: () => void;
}

export function DocumentPanel({
  documents,
  useRag,
  onToggleRag,
  useMemory,
  onToggleMemory,
}: DocumentPanelProps) {
  const readyCount = documents.filter((d) => d.status === 'ready').length;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 bg-card border border-border/80 rounded-xl p-1.5 shadow-xs shrink-0">
        {readyCount > 0 && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant={useRag ? 'default' : 'outline'}
                  className={`h-10 px-3.5 text-sm font-medium gap-2 rounded-lg shrink-0 ${
                    useRag ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : ''
                  }`}
                  onClick={onToggleRag}
                />
              }
            >
              <FileText className="h-4 w-4" />
              <span>RAG {useRag ? 'On' : 'Off'}</span>
            </TooltipTrigger>
            <TooltipContent>
              {useRag
                ? 'RAG enabled — model answers draw context from uploaded documents'
                : 'Enable RAG to supply uploaded documents as context'}
            </TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant={useMemory ? 'default' : 'outline'}
                className={`h-10 px-3.5 text-sm font-medium gap-2 rounded-lg shrink-0 ${
                  useMemory ? 'bg-primary text-primary-foreground font-semibold shadow-xs' : ''
                }`}
                onClick={onToggleMemory}
              />
            }
          >
            <Brain className="h-4 w-4" />
            <span>Memory {useMemory ? 'On' : 'Off'}</span>
          </TooltipTrigger>
          <TooltipContent>
            {useMemory
              ? 'Memory enabled — retains user context and facts'
              : 'Enable memory to retain context across messages'}
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
