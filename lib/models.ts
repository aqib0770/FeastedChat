import { type ModelConfig } from '@/types';

export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: 'claude-sonnet-4',
    name: 'Claude Sonnet 4',
    provider: 'Anthropic',
    gatewayId: 'anthropic/claude-sonnet-4',
  },
  {
    id: 'claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5',
    provider: 'Anthropic',
    gatewayId: 'anthropic/claude-sonnet-4-5',
  },
  {
    id: 'claude-opus-4',
    name: 'Claude Opus 4',
    provider: 'Anthropic',
    gatewayId: 'anthropic/claude-opus-4',
  },
  {
    id: 'claude-opus-4.1',
    name: 'Claude Opus 4.1',
    provider: 'Anthropic',
    gatewayId: 'anthropic/claude-opus-4-1',
  },
  {
    id: 'claude-haiku-4.5',
    name: 'Claude Haiku 4.5',
    provider: 'Anthropic',
    gatewayId: 'anthropic/claude-haiku-4-5',
  },
  {
    id: 'llama-4-scout-17b',
    name: 'Llama 4 Scout 17B',
    provider: 'Meta',
    gatewayId: 'meta/llama-4-scout-17b',
  },
  {
    id: 'llama-4-maverick-17b',
    name: 'Llama 4 Maverick 17B',
    provider: 'Meta',
    gatewayId: 'meta/llama-4-maverick-17b',
  },
  {
    id: 'llama-3.3-70b',
    name: 'Llama 3.3 70B',
    provider: 'Meta',
    gatewayId: 'meta/llama-3.3-70b',
  },
  {
    id: 'deepseek-r1',
    name: 'DeepSeek R1',
    provider: 'DeepSeek',
    gatewayId: 'deepseek/deepseek-r1',
  },
  {
    id: 'nova-premier',
    name: 'Nova Premier',
    provider: 'Amazon',
    gatewayId: 'amazon/nova-premier',
  },
  {
    id: 'nova-pro',
    name: 'Nova Pro',
    provider: 'Amazon',
    gatewayId: 'amazon/nova-pro',
  },
  {
    id: 'nova-lite',
    name: 'Nova Lite',
    provider: 'Amazon',
    gatewayId: 'amazon/nova-lite',
  },
  {
    id: 'nova-micro',
    name: 'Nova Micro',
    provider: 'Amazon',
    gatewayId: 'amazon/nova-micro',
  },
  {
    id: 'mistral-large',
    name: 'Mistral Large',
    provider: 'Mistral',
    gatewayId: 'mistral/mistral-large',
  },
  {
    id: 'pixtral-large',
    name: 'Pixtral Large',
    provider: 'Mistral',
    gatewayId: 'mistral/pixtral-large-2502',
  },
  {
    id: 'command-r-plus',
    name: 'Command R+',
    provider: 'Cohere',
    gatewayId: 'cohere/command-r-plus',
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    gatewayId: 'openai/gpt-4o',
  },
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    gatewayId: 'openai/gpt-4o-mini',
  },
];

export const DEFAULT_SELECTED_MODEL_IDS = ['claude-sonnet-4', 'nova-lite', 'llama-4-maverick-17b'];

export function getModelById(id: string): ModelConfig | undefined {
  return AVAILABLE_MODELS.find((m) => m.id === id);
}

export function getModelByGatewayId(gatewayId: string): ModelConfig | undefined {
  return AVAILABLE_MODELS.find((m) => m.gatewayId === gatewayId);
}
