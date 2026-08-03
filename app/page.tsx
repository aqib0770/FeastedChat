'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Header } from '@/components/header';
import { Toolbar } from '@/components/toolbar';
import { DocumentPanel } from '@/components/document-panel';
import { PromptInput } from '@/components/prompt-input';
import { ChatPanel } from '@/components/chat-panel';
import { AppSidebar } from '@/components/sidebar';
import { QuestionCards } from '@/components/question-cards';
import { TimelineView } from '@/components/timeline-view';
import { ModeToggle } from '@/components/mode-toggle';
import { ModelFilter } from '@/components/model-filter';
import { useChatComparison } from '@/hooks/use-chat-comparison';
import { useConversations } from '@/hooks/use-conversations';
import { useDocuments } from '@/hooks/use-documents';
import { getModelById } from '@/lib/models';
import type { ChatPanelRef } from '@/types';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export default function Home() {
  const {
    selectedModelIds,
    errorToast,
    clearToast,
    toggleModel,
    registerPanel,
    sendToAll,
    stopAll,
    clearAll,
    isAnyStreaming,
    conversationId,
    turns,
    viewMode,
    setViewMode,
    focusedTurnIndex,
    focusTurn,
    modelFilter,
    setModelFilter,
    participatingModelIds,
    hydrateConversation,
    startNewConversation,
    reloadTurns,
    getInitialMessagesForModel,
  } = useChatComparison();

  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    loadConversation,
    deleteConversation,
    refreshConversations,
  } = useConversations();

  // Track streaming state reactively for the UI
  const [streamingState, setStreamingState] = useState(false);
  const [useMemory, setUseMemory] = useState(true);

  const activeConvId = activeConversationId ?? conversationId;
  const { documents, isUploading, uploadDocument, deleteDocument } = useDocuments(activeConvId);

  const handleUpload = useCallback(
    async (file: File) => {
      await uploadDocument(file);
    },
    [uploadDocument]
  );

  const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (streamingIntervalRef.current) clearInterval(streamingIntervalRef.current);
    };
  }, []);

  const handleSend = useCallback(
    async (content: string) => {
      await sendToAll(content);
      // Start polling streaming state
      setStreamingState(true);

      if (streamingIntervalRef.current) clearInterval(streamingIntervalRef.current);

      const startTime = Date.now();
      streamingIntervalRef.current = setInterval(() => {
        const isStreaming = isAnyStreaming();
        const elapsed = Date.now() - startTime;

        // Stop polling if all streams finished OR if 60s safety timeout reached
        if (!isStreaming || elapsed > 60000) {
          setStreamingState(false);
          if (streamingIntervalRef.current) {
            clearInterval(streamingIntervalRef.current);
            streamingIntervalRef.current = null;
          }
          // Refresh sidebar and turns to show updated conversation
          refreshConversations();
          reloadTurns();
        }
      }, 200);
    },
    [sendToAll, isAnyStreaming, refreshConversations, reloadTurns]
  );

  const handleStopAll = useCallback(() => {
    stopAll();
    setStreamingState(false);
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
      streamingIntervalRef.current = null;
    }
  }, [stopAll]);

  const handleClearAll = useCallback(() => {
    clearAll();
    setStreamingState(false);
    if (streamingIntervalRef.current) {
      clearInterval(streamingIntervalRef.current);
      streamingIntervalRef.current = null;
    }
  }, [clearAll]);

  const handleSelectConversation = useCallback(
    async (id: string) => {
      try {
        const detail = await loadConversation(id);
        hydrateConversation(detail);
      } catch (err) {
        console.error('Failed to load conversation:', err);
      }
    },
    [loadConversation, hydrateConversation]
  );

  const handleNewConversation = useCallback(() => {
    startNewConversation();
    setActiveConversationId(null);
  }, [startNewConversation, setActiveConversationId]);

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      try {
        await deleteConversation(id);
        // If the deleted conversation was active, start fresh
        if (activeConversationId === id) {
          startNewConversation();
        }
      } catch (err) {
        console.error('Failed to delete conversation:', err);
      }
    },
    [deleteConversation, activeConversationId, startNewConversation]
  );

  // Create stable ref callbacks for each model (memoized so refs survive re-renders)
  const refCallbacks = useMemo(() => {
    const map = new Map<string, (ref: ChatPanelRef | null) => void>();
    return {
      get(modelId: string) {
        let cb = map.get(modelId);
        if (!cb) {
          cb = (ref) => registerPanel(modelId, ref);
          map.set(modelId, cb);
        }
        return cb;
      },
    };
  }, [registerPanel]);

  // Stable panel key prefix
  const panelKeyPrefix = conversationId ?? 'new';

  // Filter panels in Compare mode if a modelFilter is active
  const displayModelIds = modelFilter ? [modelFilter] : selectedModelIds;

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar
        conversations={conversations}
        activeConversationId={activeConversationId ?? conversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
      />

      <SidebarInset className="flex flex-col h-screen overflow-hidden">
        <Header />

        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-6 py-3 bg-muted/20 border-b border-border/80 gap-3 shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-3 shrink min-w-0">
            <Toolbar
              selectedModelIds={selectedModelIds}
              onToggleModel={toggleModel}
              onStopAll={handleStopAll}
              onClearAll={handleClearAll}
            />
            <DocumentPanel useMemory={useMemory} onToggleMemory={() => setUseMemory((v) => !v)} />
          </div>
          <div className="flex items-center gap-2 bg-card border border-border/80 rounded-xl p-1.5 shadow-xs shrink-0 ml-auto">
            <ModelFilter
              availableModelIds={participatingModelIds}
              selectedModelId={modelFilter}
              onSelectModel={setModelFilter}
            />
            {turns.length > 0 && <ModeToggle mode={viewMode} onModeChange={setViewMode} />}
          </div>
        </div>

        {/* Question Cards navigation strip (shown when there are turns) */}
        {turns.length > 0 && (
          <QuestionCards
            turns={turns}
            focusedTurnIndex={focusedTurnIndex}
            onSelectTurn={focusTurn}
          />
        )}

        {/* Main content */}
        <div className="flex-1 overflow-auto">
          {viewMode === 'timeline' ? (
            <TimelineView
              turns={turns}
              modelFilter={modelFilter}
              focusedTurnIndex={focusedTurnIndex}
            />
          ) : displayModelIds.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-3">
                <p className="text-muted-foreground text-lg">No models selected</p>
                <p className="text-muted-foreground/60 text-sm">
                  Use the toolbar above to add models and start comparing.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 h-full">
              <div
                className="grid gap-4 h-full"
                style={{
                  gridTemplateColumns: `repeat(${Math.min(displayModelIds.length, 5)}, minmax(0, 1fr))`,
                }}
              >
                {displayModelIds.map((modelId) => {
                  const config = getModelById(modelId);
                  if (!config) return null;
                  const initialMessages = getInitialMessagesForModel(modelId);
                  return (
                    <ChatPanel
                      key={`${panelKeyPrefix}:${modelId}`}
                      ref={refCallbacks.get(modelId)}
                      modelConfig={config}
                      onRemove={
                        !modelFilter && selectedModelIds.includes(modelId)
                          ? () => toggleModel(modelId)
                          : undefined
                      }
                      initialMessages={initialMessages.length > 0 ? initialMessages : undefined}
                      chatId={`${panelKeyPrefix}:${modelId}`}
                      focusedTurnIndex={focusedTurnIndex}
                      turns={turns}
                      useMemory={useMemory}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Shared Prompt Input with PDF upload button & document attachments */}
        <PromptInput
          onSend={handleSend}
          isAnyStreaming={streamingState}
          disabled={selectedModelIds.length === 0}
          isUploading={isUploading}
          onUpload={handleUpload}
          documents={documents}
          onDeleteDocument={deleteDocument}
        />

        {/* Floating Error Toast Notification */}
        {errorToast && (
          <div className="fixed bottom-24 right-6 z-50 flex items-center gap-3 bg-destructive text-destructive-foreground px-4 py-3 rounded-lg shadow-lg border animate-in fade-in slide-in-from-bottom-5">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span className="text-sm font-medium">{errorToast}</span>
            <button
              onClick={clearToast}
              className="ml-2 rounded-md p-1 hover:bg-destructive-foreground/20 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </SidebarInset>
    </SidebarProvider>
  );
}
