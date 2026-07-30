'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { DEFAULT_SELECTED_MODEL_IDS, getModelById } from '@/lib/models';
import type { ChatPanelRef } from '@/types';
import type {
  ConversationDetail,
  StoredTurn,
  StoredResponse,
  PanelViewMode,
} from '@/lib/conversation-utils';
import { buildModelThreadMessages, getModelsUsedInConversation } from '@/lib/conversation-utils';

/**
 * Orchestration hook for managing the multi-chat comparison.
 *
 * Responsibilities:
 * - Track which models are currently selected
 * - Hold refs to each ChatPanel for imperative control
 * - Manage conversation persistence (create turns, track IDs)
 * - Provide send-to-all, stop-all, clear-all actions
 * - Support history hydration from ConversationDetail
 * - Manage view modes (full/snapshot) and focused turn
 */
export function useChatComparison() {
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>(DEFAULT_SELECTED_MODEL_IDS);
  const [errorToast, setErrorToast] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [turns, setTurns] = useState<StoredTurn[]>([]);
  const [viewMode, setViewMode] = useState<'compare' | 'timeline'>('compare');
  const [panelViewMode, setPanelViewMode] = useState<PanelViewMode>('full');
  const [focusedTurnIndex, setFocusedTurnIndex] = useState<number | null>(null);
  const [modelFilter, setModelFilter] = useState<string | null>(null);

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (errorToast) {
      const timer = setTimeout(() => {
        setErrorToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [errorToast]);

  // Map of model ID → ChatPanelRef
  const panelRefs = useRef<Map<string, ChatPanelRef>>(new Map());

  /** Clear the current error toast message */
  const clearToast = useCallback(() => {
    setErrorToast(null);
  }, []);

  /** Register a panel ref (called by each ChatPanel on mount) */
  const registerPanel = useCallback((modelId: string, ref: ChatPanelRef | null) => {
    if (ref) {
      panelRefs.current.set(modelId, ref);
    } else {
      panelRefs.current.delete(modelId);
    }
  }, []);

  /** Toggle a model on/off */
  const toggleModel = useCallback(
    async (modelId: string) => {
      setSelectedModelIds((prev) => {
        if (prev.includes(modelId)) {
          // Remove — also clean up the panel ref
          panelRefs.current.delete(modelId);
          const next = prev.filter((id) => id !== modelId);
          // Update server-side active models
          if (conversationId) {
            fetch(`/api/conversations/${conversationId}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ activeModelIds: next }),
            }).catch(console.error);
          }
          return next;
        }
        if (prev.length >= 5) {
          setErrorToast(
            'Maximum limit reached: You can compare up to 5 models at a time. Please remove a model before adding a new one.'
          );
          return prev;
        }
        setErrorToast(null);
        const next = [...prev, modelId];
        // Update server-side active models
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

  /** Create a turn on the server and stream responses */
  const sendToAll = useCallback(
    async (content: string) => {
      let convId = conversationId;

      // If no conversation exists yet, create one
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
          // Fallback: send without persistence
          panelRefs.current.forEach((ref) => ref.sendMessage(content));
          return;
        }
      }

      // Create a turn on the server
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

        // Populate responses for local turn state
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

        // Add turn to local state for question cards
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

        // Send to each panel with persistence IDs
        panelRefs.current.forEach((ref, modelId) => {
          const responseId = turnData.responses[modelId];
          if (responseId) {
            ref.sendMessage(content, {
              conversationId: convId!,
              turnId: turnData.turnId,
              responseId,
            });
          } else {
            // Model was added after turn was created but before send
            ref.sendMessage(content);
          }
        });
      } catch (err) {
        console.error('Failed to create turn:', err);
        // Fallback: send without persistence
        panelRefs.current.forEach((ref) => ref.sendMessage(content));
      }
    },
    [conversationId, selectedModelIds]
  );

  /** Stop streaming on all panels */
  const stopAll = useCallback(() => {
    panelRefs.current.forEach((ref) => {
      ref.stop();
    });
  }, []);

  /** Clear messages on all panels and reset conversation */
  const clearAll = useCallback(() => {
    panelRefs.current.forEach((ref) => {
      ref.clear();
    });
    setTurns([]);
    setFocusedTurnIndex(null);
    setPanelViewMode('full');
  }, []);

  /** Check if any panel is currently streaming */
  const isAnyStreaming = useCallback((): boolean => {
    for (const ref of panelRefs.current.values()) {
      if (ref.isStreaming) return true;
    }
    return false;
  }, []);

  /** Hydrate panels from a loaded conversation */
  const hydrateConversation = useCallback((detail: ConversationDetail) => {
    // Clear existing panels
    panelRefs.current.forEach((ref) => ref.clear());

    setConversationId(detail.conversation.id);
    setTurns(detail.turns);
    setSelectedModelIds(detail.conversation.activeModelIds);
    setFocusedTurnIndex(null);
    setPanelViewMode('full');
    setViewMode('compare');
    setModelFilter(null);
  }, []);

  /** Start a brand new conversation (reset everything) */
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

  /** Reload turns from server */
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

  /** Get all unique model IDs that are selected or have participated in this conversation */
  const participatingModelIds = Array.from(
    new Set([...selectedModelIds, ...getModelsUsedInConversation(turns)])
  );

  /** Focus on a specific turn (snapshot mode) or show all (full mode) */
  const focusTurn = useCallback((turnIndex: number | null) => {
    setFocusedTurnIndex(turnIndex);
    setPanelViewMode(turnIndex !== null ? 'snapshot' : 'full');
  }, []);

  /** Get initial messages for a specific model from loaded turns */
  const getInitialMessagesForModel = useCallback(
    (modelId: string) => {
      if (turns.length === 0) return [];
      return buildModelThreadMessages(turns, modelId);
    },
    [turns]
  );

  return {
    // Model management
    selectedModelIds,
    toggleModel,
    registerPanel,

    // Conversation state
    conversationId,
    setConversationId,
    turns,

    // Actions
    sendToAll,
    stopAll,
    clearAll,
    isAnyStreaming,
    hydrateConversation,
    startNewConversation,
    reloadTurns,

    // View modes
    viewMode,
    setViewMode,
    panelViewMode,
    setPanelViewMode,
    focusedTurnIndex,
    focusTurn,
    modelFilter,
    setModelFilter,
    participatingModelIds,

    // Hydration helpers
    getInitialMessagesForModel,

    // Toast
    errorToast,
    clearToast,
  };
}
