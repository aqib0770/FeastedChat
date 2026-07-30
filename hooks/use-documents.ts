'use client';

import { useState, useCallback, useEffect } from 'react';
import type { StoredDocument } from '@/types';

export function useDocuments(conversationId?: string | null) {
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = conversationId ? `?conversationId=${conversationId}` : '';
      const res = await fetch(`/api/documents${params}`);
      if (!res.ok) throw new Error('Failed to fetch documents');
      const data = await res.json();
      setDocuments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, [conversationId]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const uploadDocument = useCallback(
    async (file: File) => {
      setIsUploading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append('file', file);
        if (conversationId) {
          formData.append('conversationId', conversationId);
        }

        const res = await fetch('/api/documents', {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error ?? 'Upload failed');
        }

        const doc: StoredDocument = await res.json();
        setDocuments((prev) => [doc, ...prev]);
        return doc;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Upload failed';
        setError(message);
        throw err;
      } finally {
        setIsUploading(false);
      }
    },
    [conversationId]
  );

  const deleteDocument = useCallback(async (id: string) => {
    setError(null);
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete document');
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      throw err;
    }
  }, []);

  const readyDocuments = documents.filter((d) => d.status === 'ready');

  return {
    documents,
    readyDocuments,
    isLoading,
    isUploading,
    error,
    uploadDocument,
    deleteDocument,
    refreshDocuments: fetchDocuments,
  };
}
