'use client';

import { useState, useCallback, useRef, type KeyboardEvent } from 'react';
import { ArrowUp, Paperclip, Loader2, FileText, Trash2, AlertCircle, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { StoredDocument } from '@/types';

export function PromptInput({
  onSend,
  isAnyStreaming,
  disabled = false,
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
    <div className="sticky bottom-0 p-4 sm:p-6 bg-background border-t border-border/80 shadow-md shrink-0">
      <div className="bg-card border-2 border-border/80 rounded-2xl p-3 sm:p-3.5 flex flex-col gap-2 shadow-xs focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
        {/* Attached PDF Chips Strip (ChatGPT style) */}
        {documents && documents.length > 0 && onDeleteDocument && (
          <div className="flex items-center gap-2 px-1 pb-2 border-b border-border/60 overflow-x-auto no-scrollbar">
            <span className="text-xs font-semibold text-muted-foreground shrink-0 flex items-center gap-1">
              <FileText className="h-3.5 w-3.5" />
              Attached:
            </span>
            {documents.map((doc) => (
              <DocumentChip key={doc.id} doc={doc} onDelete={onDeleteDocument} />
            ))}
          </div>
        )}

        <div className="flex items-end gap-2.5">
          {/* Upload PDF attachment button */}
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
                        variant="outline"
                        size="icon"
                        className="rounded-xl h-11 w-11 shrink-0 mb-0.5 border-border/80 hover:bg-muted text-muted-foreground hover:text-foreground"
                        disabled={disabled || isUploading}
                        onClick={() => fileInputRef.current?.click()}
                      />
                    }
                  >
                    {isUploading ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <Paperclip className="h-5 w-5" />
                    )}
                  </TooltipTrigger>
                  <TooltipContent>Attach PDF for RAG context</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </>
          )}

          <div className="relative flex-1 min-h-[52px]">
            <Textarea
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                isUploading
                  ? 'Uploading PDF document...'
                  : disabled
                    ? 'Select at least one model to start comparing...'
                    : 'Send a message to all models...'
              }
              disabled={disabled || isUploading}
              rows={1}
              className="border-0 shadow-none resize-none focus-visible:ring-0 min-h-[52px] max-h-[220px] p-2.5 pr-36 text-base sm:text-lg leading-relaxed w-full placeholder:text-base text-foreground"
            />

            {onToggleMemory && (
              <div className="absolute bottom-1.5 right-1.5">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger
                      render={
                        <Button
                          variant="ghost"
                          aria-pressed={useMemory}
                          className="h-11 shrink-0 px-3 gap-2 rounded-xl border-0 bg-transparent hover:bg-transparent"
                          onClick={onToggleMemory}
                        >
                          <Brain
                            className={`h-4.5 w-4.5 ${
                              useMemory ? 'text-primary' : 'text-muted-foreground'
                            }`}
                          />
                          <span className="text-sm font-medium">Memory</span>
                          <span
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                              useMemory ? 'bg-primary' : 'bg-muted border border-border/80'
                            }`}
                          >
                            <span
                              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                useMemory ? 'translate-x-[18px]' : 'translate-x-[2px]'
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
              </div>
            )}
          </div>

          <Button
            size="icon"
            className="rounded-xl h-11 w-11 shrink-0 font-semibold shadow-xs mb-0.5"
            onClick={handleSend}
            disabled={isButtonDisabled}
            suppressHydrationWarning
          >
            <ArrowUp className="h-5 w-5" />
            <span className="sr-only">Send</span>
          </Button>
        </div>
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
