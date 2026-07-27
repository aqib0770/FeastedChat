import { type ModelConfig } from '@/types';

/**
 * Registry of all available AI models.
 * Strictly configured according to specified models.
 */
export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: 'gpt-5.4-mini',
    name: 'GPT-5.4 Mini',
    provider: 'OpenAI',
    gatewayId: 'openai/gpt-5.4-mini',
    color: 'emerald',
  },
  {
    id: 'gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    provider: 'Google',
    gatewayId: 'google/gemini-2.5-flash-lite',
    color: 'blue',
  },
  {
    id: 'mimo-v2.5',
    name: 'MiMo v2.5',
    provider: 'Xiaomi',
    gatewayId: 'xiaomi/mimo-v2.5',
    color: 'amber',
  },
  {
    id: 'muse-spark-1.1',
    name: 'Muse Spark 1.1',
    provider: 'Meta',
    gatewayId: 'meta/muse-spark-1.1',
    color: 'indigo',
  },
  {
    id: 'glm-5v-turbo',
    name: 'GLM 5V Turbo',
    provider: 'Zai',
    gatewayId: 'zai/glm-5v-turbo',
    color: 'violet',
  },
  {
    id: 'seedance-2.0',
    name: 'Seedance 2.0',
    provider: 'ByteDance',
    gatewayId: 'bytedance/seedance-2.0',
    color: 'rose',
  },
];

/** IDs of models selected by default on first load */
export const DEFAULT_SELECTED_MODEL_IDS = ['gpt-5.4-mini', 'gemini-2.5-flash-lite', 'mimo-v2.5'];

/** Look up a model by its internal ID */
export function getModelById(id: string): ModelConfig | undefined {
  return AVAILABLE_MODELS.find((m) => m.id === id);
}

/** Look up a model by its gateway ID */
export function getModelByGatewayId(gatewayId: string): ModelConfig | undefined {
  return AVAILABLE_MODELS.find((m) => m.gatewayId === gatewayId);
}
