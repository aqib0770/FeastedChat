import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { getModel } from "@/lib/gateway";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const {
      messages,
      model,
    }: { messages: UIMessage[]; model: string } = await req.json();

    if (!model || !messages) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: model, messages" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const result = streamText({
      model: getModel(model),
      messages: await convertToModelMessages(messages),
    });

    return createUIMessageStreamResponse({
      stream: toUIMessageStream({ stream: result.stream }),
    });
  } catch (error) {
    console.error("[/api/chat] Error:", error);

    const message =
      error instanceof Error ? error.message : "An unexpected error occurred";

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
