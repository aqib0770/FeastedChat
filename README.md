# FeastedChat — Multi-Model AI Comparison

Compare multiple AI models side-by-side. Type one prompt, get streaming responses from GPT, Claude, Gemini, Grok, DeepSeek, and Qwen simultaneously.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local and add your Vercel AI Gateway API key

# 3. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Features

- **Multi-model comparison** — Send one prompt to multiple AI models at once
- **Independent streaming** — Each model streams its response in its own panel
- **Dynamic model selection** — Add/remove models on the fly
- **Markdown rendering** — Full GFM support with syntax-highlighted code blocks
- **Per-panel controls** — Stop, regenerate, copy, and clear per model
- **Error isolation** — If one model fails, the others continue streaming
- **Dark mode first** — Clean, minimal design

## Tech Stack

- [Next.js 16](https://nextjs.org/) (App Router)
- [Vercel AI SDK v7](https://ai-sdk.dev/) (`ai`, `@ai-sdk/react`)
- [Vercel AI Gateway](https://vercel.com/ai-gateway) (`@ai-sdk/gateway`)
- [shadcn/ui v4](https://ui.shadcn.com/) (base-nova style)
- [Tailwind CSS v4](https://tailwindcss.com/)
- [streamdown](https://github.com/vercel/streamdown) + [@streamdown/code](https://github.com/vercel/streamdown)
- TypeScript

## Adding New Models

Edit `lib/models.ts` and add an entry to the `AVAILABLE_MODELS` array:

```ts
{
  id: "your-model-id",
  name: "Display Name",
  provider: "Provider",
  gatewayId: "provider/model-name",  // Vercel AI Gateway format
  color: "emerald",                   // Tailwind color name
}
```

No other code changes needed.

## Architecture

```
Browser                    Server
┌──────────────┐          ┌──────────────────┐
│  ChatPanel 1 │──POST──▶ │ /api/chat        │
│  ChatPanel 2 │──POST──▶ │  ↓ getModel()    │
│  ChatPanel 3 │──POST──▶ │  ↓ streamText()  │
│  ...         │          │  ↓ AI Gateway     │──▶ OpenAI / Anthropic / Google / ...
└──────────────┘          └──────────────────┘
```

Each panel owns its own `useChat` instance and streams independently.

## Environment Variables

| Variable             | Required | Description               |
| -------------------- | -------- | ------------------------- |
| `AI_GATEWAY_API_KEY` | Yes      | Vercel AI Gateway API key |
