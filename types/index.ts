export interface ModelConfig {
  /** Unique internal identifier (e.g. "gpt-4.1") */
  id: string;
  /** Display name shown in the panel header */
  name: string;
  /** Provider label (e.g. "OpenAI", "Anthropic") */
  provider: string;
  /** Gateway model string in "provider/model" format */
  gatewayId: string;
  /** Accent color for the provider badge */
  color: string;
}

export interface PanelMeta {
  /** Elapsed time in milliseconds since the request was sent */
  elapsedMs: number;
  /** Approximate token count (placeholder — increments per chunk) */
  tokenCount: number;
}

/**
 * Methods exposed by each ChatPanel via ref,
 * allowing the parent to imperatively send messages
 * and control streaming.
 */
export interface ChatPanelRef {
  /** Append a user message and start streaming */
  sendMessage: (content: string) => void;
  /** Abort the current stream */
  stop: () => void;
  /** Clear all messages in this panel */
  clear: () => void;
  /** Regenerate the last assistant response */
  reload: () => void;
  /** Whether this panel is currently streaming */
  isStreaming: boolean;
}
