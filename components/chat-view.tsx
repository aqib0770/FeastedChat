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
import { SearchDialog } from '@/components/search-dialog';

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
  const [searchOpen, setSearchOpen] = useState(false);

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
    async (id: string, turnIndex?: number | null) => {
      try {
        const detail = await loadConversation(id);
        hydrateConversation(detail);
        window.history.pushState({}, '', `/c/${id}`);
        if (turnIndex != null) {
          // hydrateConversation resets focusedTurnIndex to null, so queue focus for next tick
          setTimeout(() => focusTurn(turnIndex), 0);
        }
      } catch (err) {
        console.error('Failed to load conversation:', err);
      }
    },
    [loadConversation, hydrateConversation, focusTurn]
  );

  const handleSearchSelect = useCallback(
    (conversationId: string, turnIndex: number | null) => {
      setSearchOpen(false);
      handleSelectConversation(conversationId, turnIndex);
    },
    [handleSelectConversation]
  );

  // Global Ctrl/Cmd+K shortcut for search (ChatGPT-style)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

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

  const displayModelIds = modelFilter && modelFilter.length > 0 ? modelFilter : selectedModelIds;

  return (
    <SidebarProvider defaultOpen={true} className="h-svh overflow-hidden">
      <AppSidebar
        conversations={conversations}
        activeConversationId={activeConversationId ?? conversationId}
        onSelectConversation={(id) => handleSelectConversation(id)}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        onSearchClick={() => setSearchOpen(true)}
      />
      <SearchDialog open={searchOpen} onOpenChange={setSearchOpen} onSelect={handleSearchSelect} />

      <SidebarInset className="flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-transparent gap-2 shrink-0 overflow-x-auto no-scrollbar h-12">
          <div className="flex items-center gap-2 shrink min-w-0">
            <Toolbar selectedModelIds={selectedModelIds} onToggleModel={toggleModel} />
            {turns.length > 0 && (
              <QuestionCards
                turns={turns}
                focusedTurnIndex={focusedTurnIndex}
                onSelectTurn={focusTurn}
              />
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-auto">
            <ModelFilter
              availableModelIds={participatingModelIds}
              selectedModelIds={modelFilter}
              onSelectModels={setModelFilter}
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
            <div className="p-3 h-full">
              <div
                className="grid gap-3 h-full"
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
                        (modelFilter === null || modelFilter.length === 0) &&
                        selectedModelIds.includes(modelId)
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

        {viewMode !== 'timeline' && (
          <PromptInput
            onSend={handleSend}
            isAnyStreaming={streamingState}
            disabled={selectedModelIds.length === 0}
            isUploading={isUploading}
            onUpload={handleUpload}
            documents={documents}
            onDeleteDocument={deleteDocument}
            useMemory={useMemory}
            onToggleMemory={() => setUseMemory((v) => !v)}
          />
        )}

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
