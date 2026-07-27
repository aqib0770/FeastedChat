'use client';

import { useState, useCallback, useRef } from 'react';
import { DEFAULT_SELECTED_MODEL_IDS } from '@/lib/models';
import type { ChatPanelRef } from '@/types';

/**
 * Orchestration hook for managing the multi-chat comparison.
 *
 * Responsibilities:
 * - Track which models are currently selected
 * - Hold refs to each ChatPanel for imperative control
 * - Provide send-to-all, stop-all, clear-all actions
 */
export function useChatComparison() {
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>(DEFAULT_SELECTED_MODEL_IDS);

  // Map of model ID → ChatPanelRef
  const panelRefs = useRef<Map<string, ChatPanelRef>>(new Map());

  /** Register a panel ref (called by each ChatPanel on mount) */
  const registerPanel = useCallback((modelId: string, ref: ChatPanelRef | null) => {
    if (ref) {
      panelRefs.current.set(modelId, ref);
    } else {
      panelRefs.current.delete(modelId);
    }
  }, []);

  /** Toggle a model on/off */
  const toggleModel = useCallback((modelId: string) => {
    setSelectedModelIds((prev) => {
      if (prev.includes(modelId)) {
        // Remove — also clean up the panel ref
        panelRefs.current.delete(modelId);
        return prev.filter((id) => id !== modelId);
      }
      return [...prev, modelId];
    });
  }, []);

  /** Send a user message to every active panel */
  const sendToAll = useCallback((content: string) => {
    panelRefs.current.forEach((ref) => {
      ref.sendMessage(content);
    });
  }, []);

  /** Stop streaming on all panels */
  const stopAll = useCallback(() => {
    panelRefs.current.forEach((ref) => {
      ref.stop();
    });
  }, []);

  /** Clear messages on all panels */
  const clearAll = useCallback(() => {
    panelRefs.current.forEach((ref) => {
      ref.clear();
    });
  }, []);

  /** Check if any panel is currently streaming */
  const isAnyStreaming = useCallback((): boolean => {
    for (const ref of panelRefs.current.values()) {
      if (ref.isStreaming) return true;
    }
    return false;
  }, []);

  return {
    selectedModelIds,
    toggleModel,
    registerPanel,
    sendToAll,
    stopAll,
    clearAll,
    isAnyStreaming,
  };
}
