# MFlow Agents SDK

A TypeScript/JavaScript SDK for building and working with AI agents across multiple large language model providers. This SDK provides a unified interface for creating agents with OpenAI, Anthropic Claude, and Together AI models.

## Features

- **Multi-provider support**: Use models from OpenAI, Anthropic, and Together AI
- **Streaming responses**: Built-in support for Server-Sent Events (SSE) streaming
- **Agent communication**: Framework for specialized agents to collaborate
- **TypeScript support**: Full type definitions for improved developer experience
- **Cross-environment compatibility**: Works in both ESM and CommonJS environments

## Installation

```bash
npm install mflow-agents-sdk
```

## Supported Models

The SDK currently supports the following models:

- **OpenAI**:

  - `chatgpt-4o` (GPT-4o)
  - `o3-mini` (o3-mini-2025-01-31)

- **Anthropic**:

  - `claude-3-5-sonnet` (claude-3-5-sonnet-20241022)
  - `claude-3-7-sonnet` (claude-3-7-sonnet-20250219)

- **Together AI**:
  - `deepseek-v3` (deepseek-ai/DeepSeek-V3)
  - `deepseek-r1` (deepseek-ai/DeepSeek-R1)

## Authentication

To use the SDK, you'll need to set the following environment variables for the models you plan to use:

```
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
TOGETHER_API_KEY=your-together-api-key
```

## Usage

### Basic Example

```typescript
import express from "express";
import { StreamingAgent } from "mflow-agents-sdk";

const app = express();
app.use(express.json());

// Create a streaming endpoint
app.post("/api/chat", async (req, res) => {
  const { message, previousMessages, model } = req.body;

  const systemMessage =
    "You are a helpful assistant that provides clear and concise answers.";

  const agent = new StreamingAgent(model, res, systemMessage);

  await agent.run(message, previousMessages);
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
```

## License

MIT
