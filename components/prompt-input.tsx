'use client';

import { useState, useCallback, useRef, type KeyboardEvent } from 'react';
import {
  ArrowUp,
  Paperclip,
  Loader2,
  FileText,
  Trash2,
  AlertCircle,
  Brain,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { StoredDocument } from '@/types';

export function PromptInput({
  onSend,
  isAnyStreaming,
  disabled = false,
  disabledPlaceholder,
  isUploading = false,
  onUpload,
  documents = [],
  onDeleteDocument,
  useMemory = false,
  onToggleMemory,
}: {
  onSend: (content: string) => void;
  isAnyStreaming: boolean;
  disabled?: boolean;
  disabledPlaceholder?: string;
  isUploading?: boolean;
  onUpload?: (file: File) => Promise<void>;
  documents?: StoredDocument[];
  onDeleteDocument?: (id: string) => Promise<void>;
  useMemory?: boolean;
  onToggleMemory?: () => void;
}) {
  const [value, setValue] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isButtonDisabled = disabled || !value.trim() || isAnyStreaming || isUploading;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        const trimmed = value.trim();
        if (trimmed && !isAnyStreaming && !disabled && !isUploading) {
          onSend(trimmed);
          setValue('');
        }
      }
    },
    [value, isAnyStreaming, disabled, isUploading, onSend]
  );

  const handleSend = () => {
    const trimmed = value.trim();
    if (trimmed && !isAnyStreaming && !disabled && !isUploading) {
      onSend(trimmed);
      setValue('');
    }
  };

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && onUpload) {
        await onUpload(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [onUpload]
  );

  return (
    <div className="sticky bottom-0 px-6 pb-4 pt-2 bg-background shrink-0 flex flex-col w-full z-20">
      <div className="bg-card border border-border/80 rounded-2xl p-2 flex flex-col gap-2 shadow-xs focus-within:border-border/100 transition-all w-full">
        {}
        {documents && documents.length > 0 && onDeleteDocument && (
          <div className="flex items-center gap-2 px-2 pb-2 border-b border-border/60 overflow-x-auto no-scrollbar">
            <span className="text-xs font-semibold text-muted-foreground shrink-0 flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              Attached:
            </span>
            {documents.map((doc) => (
              <DocumentChip key={doc.id} doc={doc} onDelete={onDeleteDocument} />
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 w-full">
          {}
          {onUpload && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        size="icon"
                        className="rounded-xl h-9 w-9 shrink-0 text-muted-foreground hover:text-foreground hover:bg-muted/50 border-0"
                        disabled={disabled || isUploading}
                        onClick={() => fileInputRef.current?.click()}
                      />
                    }
                  >
                    {isUploading ? (
                      <Loader2 className="h-4.5 w-4.5 animate-spin text-primary" />
                    ) : (
                      <Paperclip className="h-4.5 w-4.5" />
                    )}
                  </TooltipTrigger>
                  <TooltipContent>Attach PDF for RAG context</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}

          <div className="relative flex-1 flex items-center min-h-[38px]">
            <textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isUploading
                  ? 'Uploading PDF document...'
                  : disabled
                    ? (disabledPlaceholder ?? 'Select at least one model to start comparing...')
                    : 'Send a message to all models...'
              }
              disabled={disabled || isUploading}
              rows={1}
              className="bg-transparent border-0 outline-none shadow-none resize-none focus:outline-none focus:ring-0 focus-visible:ring-0 min-h-[38px] max-h-[160px] py-1.5 px-1 text-sm leading-relaxed w-full placeholder:text-muted-foreground/60 text-foreground"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onToggleMemory && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <Button
                        variant="ghost"
                        aria-pressed={useMemory}
                        className="h-9 shrink-0 px-2 gap-2 rounded-xl border-0 bg-transparent hover:bg-transparent text-muted-foreground hover:text-foreground"
                        onClick={onToggleMemory}
                      >
                        <Brain
                          className={`h-4 w-4 ${useMemory ? 'text-primary' : 'text-muted-foreground'}`}
                        />
                        <span className="text-xs font-semibold">Memory</span>
                        <span
                          className={`relative inline-flex h-4 w-8 items-center rounded-full transition-colors ${
                            useMemory ? 'bg-primary' : 'bg-muted border border-border/80'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-background shadow transition-transform ${
                              useMemory ? 'translate-x-[15px]' : 'translate-x-[1px]'
                            }`}
                          />
                        </span>
                      </Button>
                    }
                  >
                    Memory
                  </TooltipTrigger>
                  <TooltipContent>
                    {useMemory
                      ? 'Memory enabled — retains user context and facts'
                      : 'Enable memory to retain context across messages'}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <Button
              size="icon"
              className="rounded-xl h-9 w-9 shrink-0 font-semibold bg-primary text-primary-foreground hover:bg-primary/90 border-0 shadow-none"
              onClick={handleSend}
              disabled={isButtonDisabled}
              suppressHydrationWarning
            >
              <ArrowUp className="h-4.5 w-4.5 text-primary-foreground font-bold" />
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </div>
      </div>
      <div className="text-[10px] sm:text-xs text-muted-foreground/65 mt-2 flex items-center justify-center gap-1 font-medium">
        <span>Responses from all active models appear here for easy comparison</span>
        <Info className="h-3.5 w-3.5 text-muted-foreground/80" />
      </div>
    </div>
  );
}

function DocumentChip({
  doc,
  onDelete,
}: {
  doc: StoredDocument;
  onDelete: (id: string) => Promise<void>;
}) {
  const statusIcon =
    doc.status === 'processing' ? (
      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
    ) : doc.status === 'error' ? (
      <AlertCircle className="h-3.5 w-3.5 text-destructive" />
    ) : null;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger
          render={
            <Badge
              variant="secondary"
              className="gap-1.5 py-1 px-2.5 max-w-[180px] h-8 font-medium text-xs rounded-lg border border-border/80 shrink-0 bg-secondary text-secondary-foreground"
            >
              {statusIcon}
              <span className="truncate">{doc.filename}</span>
              <button
                className="ml-1 rounded hover:bg-destructive/20 p-0.5 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(doc.id);
                }}
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
              </button>
            </Badge>
          }
        />
        <TooltipContent>
          {doc.status === 'ready'
            ? `${doc.filename} (${doc.chunkCount} chunks)`
            : doc.status === 'error'
              ? `Error: ${doc.error}`
              : `Processing ${doc.filename}...`}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
