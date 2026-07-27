'use client';

import { useCallback, useRef, useState } from 'react';
import { Header } from '@/components/header';
import { Toolbar } from '@/components/toolbar';
import { PromptInput } from '@/components/prompt-input';
import { ChatPanel } from '@/components/chat-panel';
import { useChatComparison } from '@/hooks/use-chat-comparison';
import { getModelById } from '@/lib/models';
import type { ChatPanelRef } from '@/types';

export default function Home() {
  const {
    selectedModelIds,
    toggleModel,
    registerPanel,
    sendToAll,
    stopAll,
    clearAll,
    isAnyStreaming,
  } = useChatComparison();

  // Track streaming state reactively for the UI
  const [streamingState, setStreamingState] = useState(false);

  const handleSend = useCallback(
    (content: string) => {
      sendToAll(content);
      // Start polling streaming state
      setStreamingState(true);
      const interval = setInterval(() => {
        if (!isAnyStreaming()) {
          setStreamingState(false);
          clearInterval(interval);
        }
      }, 200);
    },
    [sendToAll, isAnyStreaming]
  );

  const handleStopAll = useCallback(() => {
    stopAll();
    setStreamingState(false);
  }, [stopAll]);

  const handleClearAll = useCallback(() => {
    clearAll();
    setStreamingState(false);
  }, [clearAll]);

  // Create stable ref callbacks for each model
  const refCallbacksRef = useRef<Map<string, (ref: ChatPanelRef | null) => void>>(new Map());
  const getRefCallback = useCallback(
    (modelId: string) => {
      if (!refCallbacksRef.current.has(modelId)) {
        refCallbacksRef.current.set(modelId, (ref: ChatPanelRef | null) => {
          registerPanel(modelId, ref);
        });
      }
      return refCallbacksRef.current.get(modelId)!;
    },
    [registerPanel]
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      <Toolbar
        selectedModelIds={selectedModelIds}
        onToggleModel={toggleModel}
        onStopAll={handleStopAll}
        onClearAll={handleClearAll}
      />

      {/* Chat Panels Grid */}
      <div className="flex-1 overflow-auto p-4">
        {selectedModelIds.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-3">
              <p className="text-muted-foreground text-lg">No models selected</p>
              <p className="text-muted-foreground/60 text-sm">
                Use the toolbar above to add models and start comparing.
              </p>
            </div>
          </div>
        ) : (
          <div
            className="grid gap-4 h-full"
            style={{
              gridTemplateColumns: `repeat(${Math.min(selectedModelIds.length, 5)}, minmax(0, 1fr))`,
            }}
          >
            {selectedModelIds.map((modelId) => {
              const config = getModelById(modelId);
              if (!config) return null;
              return <ChatPanel key={modelId} ref={getRefCallback(modelId)} modelConfig={config} />;
            })}
          </div>
        )}
      </div>

      {/* Shared Prompt Input */}
      <PromptInput onSend={handleSend} isAnyStreaming={streamingState} />
    </div>
  );
}
