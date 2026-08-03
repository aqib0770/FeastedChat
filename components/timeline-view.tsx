'use client';

import React, { useState } from 'react';
import { StoredTurn } from '@/lib/conversation-utils';
import { getModelById } from '@/lib/models';
import { MarkdownRenderer } from '@/components/markdown-renderer';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { User, Bot, Copy, Check } from 'lucide-react';

interface TimelineViewProps {
  turns: StoredTurn[];
  modelFilter: string | null;
  focusedTurnIndex?: number | null;
}

export function TimelineView({ turns, modelFilter, focusedTurnIndex = null }: TimelineViewProps) {
  const [copiedResponseId, setCopiedResponseId] = useState<string | null>(null);

  const handleCopy = (responseId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedResponseId(responseId);
    setTimeout(() => setCopiedResponseId((id) => (id === responseId ? null : id)), 2000);
  };

  if (!turns || turns.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
        No conversation history yet.
      </div>
    );
  }

  const visibleTurns =
    focusedTurnIndex !== null ? turns.filter((t) => t.turnIndex === focusedTurnIndex) : turns;

  return (
    <div className="flex flex-col space-y-8 max-w-4xl mx-auto pb-20 p-4">
      {visibleTurns.map((turn) => (
        <div key={turn.id} className="space-y-4">
          {/* User Prompt */}
          <div className="flex justify-end">
            <div className="max-w-[85%] space-y-1.5">
              <div className="flex items-center justify-end gap-2">
                <span className="text-xs font-medium text-muted-foreground">You</span>
                <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <User className="h-3.5 w-3.5" />
                </div>
              </div>
              <Card className="p-3.5 bg-primary text-primary-foreground border-none rounded-xl rounded-tr-none">
                <div className="whitespace-pre-wrap text-sm">{turn.userMessage.content}</div>
              </Card>
            </div>
          </div>

          {/* Model Responses */}
          <div className="space-y-3">
            {turn.responses.map((response) => {
              if (modelFilter && response.modelId !== modelFilter) return null;

              const modelInfo = getModelById(response.modelId);

              return (
                <div key={response.id} className="flex justify-start">
                  <div className="max-w-[95%] w-full space-y-1.5">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-muted border flex items-center justify-center text-muted-foreground">
                        <Bot className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-medium">
                        {modelInfo?.name || response.modelId}
                      </span>
                      <Badge variant="outline" className="text-[10px] px-1 py-0 h-4">
                        {modelInfo?.provider || 'Unknown'}
                      </Badge>
                      {response.status === 'error' && (
                        <Badge variant="destructive" className="text-[10px] px-1 py-0 h-4">
                          Error
                        </Badge>
                      )}
                    </div>
                    <Card className="p-4 rounded-xl rounded-tl-none">
                      {response.status === 'error' ? (
                        <div className="text-destructive text-sm">
                          {response.error || 'An error occurred'}
                        </div>
                      ) : (
                        <div className="text-sm">
                          {response.content ? (
                            <MarkdownRenderer content={response.content} />
                          ) : (
                            <span className="text-muted-foreground italic animate-pulse">
                              Thinking...
                            </span>
                          )}
                        </div>
                      )}
                      {response.content && (
                        <TooltipProvider>
                          <div className="flex items-center pt-2">
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 rounded-lg"
                                    onClick={() => handleCopy(response.id, response.content)}
                                  />
                                }
                              >
                                {copiedResponseId === response.id ? (
                                  <Check className="h-4 w-4 text-primary" />
                                ) : (
                                  <Copy className="h-4 w-4" />
                                )}
                              </TooltipTrigger>
                              <TooltipContent>Copy response</TooltipContent>
                            </Tooltip>
                          </div>
                        </TooltipProvider>
                      )}
                    </Card>
                  </div>
                </div>
              );
            })}

            {/* If model filter is applied and this model didn't respond in this turn */}
            {modelFilter && !turn.responses.some((r) => r.modelId === modelFilter) && (
              <div className="flex justify-start">
                <Card className="p-3 bg-muted/30 border-dashed text-muted-foreground text-xs flex items-center gap-2">
                  <Bot className="h-3.5 w-3.5 opacity-50" />
                  Model was not active for this question
                </Card>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
