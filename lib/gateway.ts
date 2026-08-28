import { createGateway, gateway as defaultGateway } from 'ai';

const gatewayInstance =
  process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN
    ? createGateway({
        apiKey: process.env.AI_GATEWAY_API_KEY,
      })
    : defaultGateway;

export function getModel(modelId: string) {
  return gatewayInstance(modelId);
}

export function getEmbeddingModel(modelId: string) {
  return gatewayInstance.embeddingModel(modelId);
}
