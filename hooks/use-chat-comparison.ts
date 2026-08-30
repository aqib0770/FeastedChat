'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  DEFAULT_SELECTED_MODEL_IDS,
  getModelById,
  MAX_MODELS_PER_CONVERSATION,
} from '@/lib/models';
import type { ChatPanelRef } from '@/types';
import type {
  ConversationDetail,
  StoredTurn,
  StoredResponse,
  PanelViewMode,
} from '@/lib/conversation-utils';
import { buildModelThreadMessages, getModelsUsedInConversation } from '@/lib/conversation-utils';

export function useChatComparison(initialConversationId?: string | null) {
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>(DEFAULT_SELECTED_MODEL_IDS);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [turns, setTurns] = useState<StoredTurn[]>([]);
  const [viewMode, setViewMode] = useState<'compare' | 'timeline'>('compare');
  const [panelViewMode, setPanelViewMode] = useState<PanelViewMode>('full');
  const [focusedTurnIndex, setFocusedTurnIndex] = useState<number | null>(null);
  const [modelFilter, setModelFilter] = useState<string[] | null>(null);

  useEffect(() => {
    if (errorToast) {
      const timer = setTimeout(() => {
        setErrorToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [errorToast]);

  const panelRefs = useRef<Map<string, ChatPanelRef>>(new Map());
  const hydrateConversation = useCallback((detail: ConversationDetail) => {
    panelRefs.current.forEach((ref) => ref.clear());

    setConversationId(detail.conversation.id);
    setTurns(detail.turns);
    setSelectedModelIds(detail.conversation.activeModelIds);
    setFocusedTurnIndex(null);
    setPanelViewMode('full');
    setViewMode('compare');
    setModelFilter(null);
  }, []);

  // When an initial conversation ID is provided (from URL), load it on mount
  useEffect(() => {
    if (!initialConversationId) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/conversations/${initialConversationId}`);
        if (!res.ok) throw new Error('Failed to load conversation');
        const detail: ConversationDetail = await res.json();
        if (!cancelled) {
          hydrateConversation(detail);
        }
      } catch (err) {
        console.error('Failed to load conversation from URL:', err);
      }
    })();

    return () => {
      cancelled = true;
    };
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialConversationId]);

  const clearToast = useCallback(() => {
    setErrorToast(null);
  }, []);

  const registerPanel = useCallback((modelId: string, ref: ChatPanelRef | null) => {
    if (ref) {
      panelRefs.current.set(modelId, ref);
    } else {
      panelRefs.current.delete(modelId);
    }
  }, []);

  const toggleModel = useCallback(
    async (modelId: string) => {
      setSelectedModelIds((prev) => {
        if (prev.includes(modelId)) {
          panelRefs.current.delete(modelId);
          const next = prev.filter((id) => id !== modelId);

          if (conversationId) {
            fetch(`/api/conversations/${conversationId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ activeModelIds: next }),
            }).catch(console.error);
          }
          return next;
        }
        if (prev.length >= MAX_MODELS_PER_CONVERSATION) {
          setErrorToast(
            `Maximum limit reached: You can compare up to ${MAX_MODELS_PER_CONVERSATION} models per conversation.`
          );
          return prev;
        }
        setErrorToast(null);
        const next = [...prev, modelId];

        if (conversationId) {
          fetch(`/api/conversations/${conversationId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activeModelIds: next }),
          }).catch(console.error);
        }
        return next;
      });
    },
    [conversationId]
  );

  const sendToAll = useCallback(
    async (content: string) => {
      let convId = conversationId;

      if (!convId) {
        try {
          const res = await fetch('/api/conversations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ activeModelIds: selectedModelIds }),
          });
          if (!res.ok) throw new Error('Failed to create conversation');
          const conv = await res.json();
          convId = conv.id;
          setConversationId(convId);
        } catch (err) {
          console.error('Failed to create conversation:', err);

          panelRefs.current.forEach((ref) => ref.sendMessage(content));
          return;
        }
      }

      try {
        const res = await fetch(`/api/conversations/${convId}/turns`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userMessage: content }),
        });
        if (!res.ok) throw new Error('Failed to create turn');
        const turnData: {
          turnId: string;
          turnIndex: number;
          responses: Record<string, string>;
        } = await res.json();

        const responseDocs: StoredResponse[] = Object.entries(turnData.responses).map(
          ([mId, rId]) => ({
            id: rId,
            turnId: turnData.turnId,
            modelId: mId,
            gatewayId: getModelById(mId)?.gatewayId || '',
            content: '',
            status: 'pending',
            createdAt: new Date().toISOString(),
          })
        );

        const newTurn: StoredTurn = {
          id: turnData.turnId,
          turnIndex: turnData.turnIndex,
          userMessage: {
            id: `user-${turnData.turnId}`,
            content,
            createdAt: new Date().toISOString(),
          },
          createdAt: new Date().toISOString(),
          responses: responseDocs,
        };
        setTurns((prev) => [...prev, newTurn]);

        panelRefs.current.forEach((ref, modelId) => {
          const responseId = turnData.responses[modelId];
          if (responseId) {
            ref.sendMessage(content, {
              conversationId: convId!,
              turnId: turnData.turnId,
              responseId,
            });
          } else {
            ref.sendMessage(content);
          }
        });
      } catch (err) {
        console.error('Failed to create turn:', err);

        panelRefs.current.forEach((ref) => ref.sendMessage(content));
      }
    },
    [conversationId, selectedModelIds]
  );

  const isAnyStreaming = useCallback((): boolean => {
    for (const ref of panelRefs.current.values()) {
      if (ref.isStreaming) return true;
    }
    return false;
  }, []);

  const startNewConversation = useCallback(() => {
    panelRefs.current.forEach((ref) => ref.clear());
    setConversationId(null);
    setTurns([]);
    setSelectedModelIds(DEFAULT_SELECTED_MODEL_IDS);
    setFocusedTurnIndex(null);
    setPanelViewMode('full');
    setViewMode('compare');
    setModelFilter(null);
  }, []);

  const reloadTurns = useCallback(
    async (convId?: string) => {
      const idToFetch = convId || conversationId;
      if (!idToFetch) return;
      try {
        const res = await fetch(`/api/conversations/${idToFetch}`);
        if (res.ok) {
          const detail = await res.json();
          if (detail?.turns) {
            setTurns(detail.turns);
          }
        }
      } catch (err) {
        console.error('Failed to reload turns:', err);
      }
    },
    [conversationId]
  );

  const participatingModelIds = Array.from(
    new Set([...selectedModelIds, ...getModelsUsedInConversation(turns)])
  );

  const focusTurn = useCallback((turnIndex: number | null) => {
    setFocusedTurnIndex(turnIndex);
    setPanelViewMode(turnIndex !== null ? 'snapshot' : 'full');
  }, []);

  const getInitialMessagesForModel = useCallback(
    (modelId: string) => {
      if (turns.length === 0) return [];
      return buildModelThreadMessages(turns, modelId);
    },
    [turns]
  );

  return {
    selectedModelIds,
    toggleModel,
    registerPanel,

    conversationId,
    setConversationId,
    turns,

    sendToAll,
    isAnyStreaming,
    hydrateConversation,
    startNewConversation,
    reloadTurns,

    viewMode,
    setViewMode,
    panelViewMode,
    setPanelViewMode,
    focusedTurnIndex,
    focusTurn,
    modelFilter,
    setModelFilter,
    participatingModelIds,

    getInitialMessagesForModel,

    errorToast,
    clearToast,
  };
}
