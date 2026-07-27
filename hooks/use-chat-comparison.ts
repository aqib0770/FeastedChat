'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
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
  const [errorToast, setErrorToast] = useState<string | null>(null);

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
  const toggleModel = useCallback((modelId: string) => {
    setSelectedModelIds((prev) => {
      if (prev.includes(modelId)) {
        // Remove — also clean up the panel ref
        panelRefs.current.delete(modelId);
        return prev.filter((id) => id !== modelId);
      }
      if (prev.length >= 5) {
        setErrorToast(
          'Maximum limit reached: You can compare up to 5 models at a time. Please remove a model before adding a new one.'
        );
        return prev;
      }
      setErrorToast(null);
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
    errorToast,
    clearToast,
    toggleModel,
    registerPanel,
    sendToAll,
    stopAll,
    clearAll,
    isAnyStreaming,
  };
}
