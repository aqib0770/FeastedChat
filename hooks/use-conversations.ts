'use client';

import { useState, useCallback, useEffect } from 'react';
import type { ConversationSummary, ConversationDetail } from '@/lib/conversation-utils';

export function useConversations() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const refreshConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/conversations');
      if (res.ok) {
        const data = await res.json();
        setConversations(
          data.sort(
            (a: ConversationSummary, b: ConversationSummary) =>
              new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
        );
      }
    } catch (error) {
      console.error('Failed to fetch conversations', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createConversation = useCallback(
    async (activeModelIds: string[]) => {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeModelIds }),
      });
      if (!res.ok) throw new Error('Failed to create conversation');
      const data = await res.json();
      await refreshConversations();
      return data as ConversationSummary;
    },
    [refreshConversations]
  );

  const loadConversation = useCallback(async (id: string) => {
    const res = await fetch(`/api/conversations/${id}`);
    if (!res.ok) throw new Error('Failed to load conversation');
    const data = await res.json();
    setActiveConversationId(id);
    return data as ConversationDetail;
  }, []);

  const deleteConversation = useCallback(
    async (id: string) => {
      const res = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete conversation');

      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
    },
    [activeConversationId]
  );

  const updateConversationModels = useCallback(
    async (id: string, activeModelIds: string[]) => {
      const res = await fetch(`/api/conversations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ activeModelIds }),
      });
      if (!res.ok) throw new Error('Failed to update models');
      await refreshConversations();
    },
    [refreshConversations]
  );

  const clearActiveConversation = useCallback(() => {
    setActiveConversationId(null);
  }, []);

  useEffect(() => {
    fetch('/api/session').then(() => refreshConversations());
  }, [refreshConversations]);

  return {
    conversations,
    activeConversationId,
    isLoading,
    createConversation,
    loadConversation,
    deleteConversation,
    refreshConversations,
    updateConversationModels,
    setActiveConversationId,
    clearActiveConversation,
  };
}
