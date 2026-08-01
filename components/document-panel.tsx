'use client';

import { useRef, useCallback } from 'react';
import { FileText, Upload, Trash2, Loader2, AlertCircle, Brain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { StoredDocument } from '@/types';

interface DocumentPanelProps {
  documents: StoredDocument[];
  isUploading: boolean;
  useRag: boolean;
  onToggleRag: () => void;
  useMemory: boolean;
  onToggleMemory: () => void;
  onUpload: (file: File) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function DocumentPanel({
  documents,
  isUploading,
  useRag,
  onToggleRag,
  useMemory,
  onToggleMemory,
  onUpload,
  onDelete,
}: DocumentPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        await onUpload(file);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [onUpload]
  );

  const readyCount = documents.filter((d) => d.status === 'ready').length;

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                disabled={isUploading}
                onClick={() => fileInputRef.current?.click()}
              />
            }
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <span className="sr-only sm:not-sr-only">
              {isUploading ? 'Uploading...' : 'Upload PDF'}
            </span>
          </TooltipTrigger>
          <TooltipContent>Upload a PDF for RAG context</TooltipContent>
        </Tooltip>

        {readyCount > 0 && (
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  variant={useRag ? 'default' : 'outline'}
                  size="sm"
                  className="gap-2"
                  onClick={onToggleRag}
                />
              }
            >
              <FileText className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">RAG {useRag ? 'On' : 'Off'}</span>
            </TooltipTrigger>
            <TooltipContent>
              {useRag
                ? 'RAG enabled — answers use uploaded documents'
                : 'Enable RAG to use uploaded documents as context'}
            </TooltipContent>
          </Tooltip>
        )}

        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant={useMemory ? 'default' : 'outline'}
                size="sm"
                className="gap-2"
                onClick={onToggleMemory}
              />
            }
          >
            <Brain className="h-4 w-4" />
            <span className="sr-only sm:not-sr-only">Memory {useMemory ? 'On' : 'Off'}</span>
          </TooltipTrigger>
          <TooltipContent>
            {useMemory
              ? 'Memory enabled — remembers facts across conversations'
              : 'Enable memory to remember user preferences and context'}
          </TooltipContent>
        </Tooltip>

        {readyCount > 0 && (
          <Badge variant="secondary" className="gap-1">
            <FileText className="h-3 w-3" />
            {readyCount} doc{readyCount === 1 ? '' : 's'}
          </Badge>
        )}

        {documents.length > 0 && (
          <div className="flex items-center gap-1">
            {documents.slice(0, 3).map((doc) => (
              <DocumentChip key={doc.id} doc={doc} onDelete={onDelete} />
            ))}
            {documents.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{documents.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
    </TooltipProvider>
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
      <Loader2 className="h-3 w-3 animate-spin" />
    ) : doc.status === 'error' ? (
      <AlertCircle className="h-3 w-3 text-destructive" />
    ) : null;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Badge variant="outline" className="gap-1 pr-1 max-w-[140px]">
            {statusIcon}
            <span className="truncate text-xs">{doc.filename}</span>
            <button
              className="ml-0.5 rounded-sm hover:bg-muted p-0.5"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(doc.id);
              }}
            >
              <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
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
  );
}
