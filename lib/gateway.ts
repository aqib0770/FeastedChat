import { gateway } from "@ai-sdk/gateway";

/**
 * Returns a model instance from the Vercel AI Gateway.
 *
 * This is the single point of model resolution — all model
 * requests flow through here. The Gateway handles authentication,
 * routing, and provider-specific API differences.
 *
 * @param gatewayId - Model identifier in "provider/model" format
 *                    (e.g. "openai/gpt-4.1", "anthropic/claude-sonnet-4")
 */
export function getModel(gatewayId: string) {
  return gateway(gatewayId);
}
