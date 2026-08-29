export type ResponseStatus = 'pending' | 'streaming' | 'complete' | 'error';

export interface StoredUserMessage {
  id: string;
  content: string;
  createdAt: string;
}

export interface StoredResponse {
  id: string;
  turnId: string;
  modelId: string;
  gatewayId: string;
  content: string;
  status: ResponseStatus;
  error?: string;
  createdAt: string;
  completedAt?: string;
}

export interface StoredTurn {
  id: string;
  turnIndex: number;
  userMessage: StoredUserMessage;
  createdAt: string;
  responses: StoredResponse[];
}

export interface ConversationSummary {
  id: string;
  title: string;
  activeModelIds: string[];
  updatedAt: string;
  createdAt: string;
}

export interface ConversationDetail {
  conversation: ConversationSummary;
  turns: StoredTurn[];
}

export type PanelViewMode = 'full' | 'snapshot';

export interface SearchMatch {
  kind: 'user' | 'assistant' | 'title';
  turnIndex: number | null;
  modelId?: string;
  snippet: string;
}

export interface SearchResult {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
  matches: SearchMatch[];
}

export function truncateTitle(content: string, max = 48): string {
  const trimmed = content.trim().replace(/\s+/g, ' ');
  if (trimmed.length <= max) return trimmed;
  return trimmed.slice(0, max).trimEnd() + '…';
}

export function buildModelThreadMessages(
  turns: StoredTurn[],
  modelId: string
): Array<{ id: string; role: 'user' | 'assistant'; parts: Array<{ type: 'text'; text: string }> }> {
  const messages: Array<{
    id: string;
    role: 'user' | 'assistant';
    parts: Array<{ type: 'text'; text: string }>;
  }> = [];

  for (const turn of turns) {
    messages.push({
      id: turn.userMessage.id,
      role: 'user',
      parts: [{ type: 'text', text: turn.userMessage.content }],
    });

    const response = turn.responses.find((r) => r.modelId === modelId);
    if (response?.status === 'complete' && response.content) {
      messages.push({
        id: response.id,
        role: 'assistant',
        parts: [{ type: 'text', text: response.content }],
      });
    }
  }

  return messages;
}

export function getModelsUsedInConversation(turns: StoredTurn[]): string[] {
  const modelIds = new Set<string>();
  for (const turn of turns) {
    for (const response of turn.responses) {
      if (response.status === 'complete' || response.content) {
        modelIds.add(response.modelId);
      }
    }
  }
  return Array.from(modelIds);
}

export function getLastTurnModelIds(turns: StoredTurn[]): string[] {
  if (turns.length === 0) return [];
  const lastTurn = turns[turns.length - 1];
  return lastTurn.responses
    .filter((r) => r.status !== 'pending' || r.content)
    .map((r) => r.modelId);
}

export function getTurnIdsForModel(turns: StoredTurn[], modelId: string | null): string[] {
  if (!modelId) return turns.map((t) => t.id);
  return turns
    .filter((t) =>
      t.responses.some((r) => r.modelId === modelId && (r.content || r.status !== 'pending'))
    )
    .map((t) => t.id);
}
