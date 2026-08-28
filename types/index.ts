export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  gatewayId: string;
}

export interface PanelMeta {
  elapsedMs: number;
  tokenCount: number;
}

export interface PersistenceIds {
  conversationId: string;
  turnId: string;
  responseId: string;
}

export interface StoredDocument {
  id: string;
  sessionKey: string;
  conversationId?: string;
  filename: string;
  status: 'processing' | 'ready' | 'error';
  chunkCount: number;
  error?: string;
  createdAt: string;
}

export interface RetrievedChunk {
  text: string;
  score: number;
  filename: string;
  chunkIndex: number;
  documentId: string;
}

export interface ChatPanelRef {
  sendMessage: (content: string, persistence?: PersistenceIds) => void;
  clear: () => void;
  reload: () => void;
  isStreaming: boolean;
}
