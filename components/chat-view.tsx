'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { Toolbar } from '@/components/toolbar';
import { PromptInput } from '@/components/prompt-input';
import { ChatPanel } from '@/components/chat-panel';
import { AppSidebar } from '@/components/sidebar';
import { QuestionCards } from '@/components/question-cards';
import { TimelineView } from '@/components/timeline-view';
import { ModeToggle } from '@/components/mode-toggle';
import { ModelFilter } from '@/components/model-filter';
import { ThemeToggle } from '@/components/theme-toggle';
import { useChatComparison } from '@/hooks/use-chat-comparison';
import { useConversations } from '@/hooks/use-conversations';
import { useDocuments } from '@/hooks/use-documents';
import { getModelById } from '@/lib/models';
import type { ChatPanelRef } from '@/types';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

interface ChatViewProps {
  initialConversationId?: string | null;
}

export function ChatView({ initialConversationId }: ChatViewProps) {
  const {
    selectedModelIds,
    errorToast,
    clearToast,
    toggleModel,
    registerPanel,
    sendToAll,
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
  } = useChatComparison(initialConversationId);

  const {
    conversations,
    activeConversationId,
    setActiveConversationId,
    loadConversation,
    deleteConversation,
    refreshConversations,
  } = useConversations();

  const [streamingState, setStreamingState] = useState(false);
  const [useMemory, setUseMemory] = useState(true);

  const activeConvId = activeConversationId ?? conversationId;
  const { documents, isUploading, uploadDocument, deleteDocument } = useDocuments(activeConvId);

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const firstUserMsg = turns.length > 0 ? turns[0].userMessage.content : null;
  const activeConvTitle = activeConv?.title || firstUserMsg;

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

  // Update URL to /c/<chatId> when a new conversation is created (no component unmount)
  // We use a ref to track the last conversationId we navigated to, so we only push once.
  const lastNavigatedId = useRef<string | null>(initialConversationId ?? null);
  useEffect(() => {
    if (conversationId && conversationId !== lastNavigatedId.current) {
      lastNavigatedId.current = conversationId;
      // Use pushState to update URL without unmounting the component
      window.history.pushState({}, '', `/c/${conversationId}`);
    }
  }, [conversationId]);

  const handleSend = useCallback(
    async (content: string) => {
      await sendToAll(content);

      setStreamingState(true);

      if (streamingIntervalRef.current) clearInterval(streamingIntervalRef.current);

      const startTime = Date.now();
      streamingIntervalRef.current = setInterval(() => {
        const isStreaming = isAnyStreaming();
        const elapsed = Date.now() - startTime;

        if (!isStreaming || elapsed > 60000) {
          setStreamingState(false);
          if (streamingIntervalRef.current) {
            clearInterval(streamingIntervalRef.current);
            streamingIntervalRef.current = null;
          }

          refreshConversations();
          reloadTurns();
        }
      }, 200);
    },
    [sendToAll, isAnyStreaming, refreshConversations, reloadTurns]
  );

  const handleSelectConversation = useCallback(
    async (id: string) => {
      try {
        const detail = await loadConversation(id);
        hydrateConversation(detail);
        window.history.pushState({}, '', `/c/${id}`);
      } catch (err) {
        console.error('Failed to load conversation:', err);
      }
    },
    [loadConversation, hydrateConversation]
  );

  const handleNewConversation = useCallback(() => {
    startNewConversation();
    setActiveConversationId(null);
    lastNavigatedId.current = null;
    window.history.pushState({}, '', '/');
  }, [startNewConversation, setActiveConversationId]);

  const handleDeleteConversation = useCallback(
    async (id: string) => {
      try {
        await deleteConversation(id);

        if (activeConversationId === id) {
          startNewConversation();
          lastNavigatedId.current = null;
          window.history.pushState({}, '', '/');
        }
      } catch (err) {
        console.error('Failed to delete conversation:', err);
      }
    },
    [deleteConversation, activeConversationId, startNewConversation]
  );

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

  const panelKeyPrefix = conversationId ?? 'new';

  const displayModelIds = modelFilter ? [modelFilter] : selectedModelIds;

  return (
    <SidebarProvider defaultOpen={true} className="h-svh overflow-hidden">
      <AppSidebar
        conversations={conversations}
        activeConversationId={activeConversationId ?? conversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
      />

      <SidebarInset className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between px-4 sm:px-6 pt-3 pb-2 bg-transparent gap-4 shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-3 shrink min-w-0">
            {activeConvTitle && (
              <span className="text-sm font-semibold text-foreground truncate max-w-[200px] sm:max-w-[300px] hidden sm:inline-block">
                {activeConvTitle}
              </span>
            )}
            <Toolbar selectedModelIds={selectedModelIds} onToggleModel={toggleModel} />
            {turns.length > 0 && (
              <QuestionCards
                turns={turns}
                focusedTurnIndex={focusedTurnIndex}
                onSelectTurn={focusTurn}
              />
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <ModelFilter
              availableModelIds={participatingModelIds}
              selectedModelId={modelFilter}
              onSelectModel={setModelFilter}
            />
            {turns.length > 0 && <ModeToggle mode={viewMode} onModeChange={setViewMode} />}
            <ThemeToggle />
          </div>
        </div>

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

        <PromptInput
          onSend={handleSend}
          isAnyStreaming={streamingState}
          disabled={selectedModelIds.length === 0 || viewMode === 'timeline'}
          disabledPlaceholder={
            viewMode === 'timeline' ? 'Prompting disabled in timeline view' : undefined
          }
          isUploading={isUploading}
          onUpload={handleUpload}
          documents={documents}
          onDeleteDocument={deleteDocument}
          useMemory={useMemory}
          onToggleMemory={() => setUseMemory((v) => !v)}
        />

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
