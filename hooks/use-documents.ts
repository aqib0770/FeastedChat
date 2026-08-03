'use client';

import { useState, useCallback, useEffect } from 'react';
import type { StoredDocument } from '@/types';

export function useDocuments(conversationId?: string | null) {
  const [documents, setDocuments] = useState<StoredDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async () => {
    const params = conversationId ? `?conversationId=${conversationId}` : '';
    const res = await fetch(`/api/documents${params}`);
    if (!res.ok) throw new Error('Failed to fetch documents');
    return (await res.json()) as StoredDocument[];
  }, [conversationId]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const data = await loadDocuments();
        if (active) {
          setDocuments(data);
          setError(null);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Failed to load documents');
        }
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [loadDocuments]);

  const refreshDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setDocuments(await loadDocuments());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setIsLoading(false);
    }
  }, [loadDocuments]);

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

  const visibleDocuments = conversationId
    ? documents.filter((d) => d.conversationId === conversationId)
    : documents.filter((d) => !d.conversationId);

  const readyDocuments = visibleDocuments.filter((d) => d.status === 'ready');

  return {
    documents: visibleDocuments,
    readyDocuments,
    isLoading,
    isUploading,
    error,
    uploadDocument,
    deleteDocument,
    refreshDocuments,
  };
}
