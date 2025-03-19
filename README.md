# Agent Integration Guide for mflow.dev

This guide explains how developers can create and register their own AI agents for integration with the mflow.dev platform. Our architecture allows specialized agents to collaborate on complex tasks, with a router agent orchestrating the workflow.

## Overview

The mflow.dev platform uses a multi-agent system where:

1. Based on the user's prompt, a router agent decides which agent should handle the request.
2. Specialized agents process and react to router's requests, by exposing the http endpoint.
3. Unified UI and router allows all agents work together

Developers can create custom agents and register them in the mflow.dev web client, making them available within the platform's agent ecosystem.

## Installation

To get started with developing agents for mflow.dev, install our SDK package using npm:

```bash
npm install mflow-agents-sdk
```

This package provides all the necessary utilities and types for creating compatible agents, handling message structures, and implementing the required communication protocols.

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

## Creating an Agent

### Basic Requirements

Your agent must:

1. Expose an HTTP endpoint that can receive and process requests
2. Accept a standardized message format
3. Return responses in a specific format for integration with other agents

### Agent Endpoint Implementation

Here's a basic template for creating a custom agent endpoint using Express:

```javascript
import express from "express";
import { StreamingAgent } from "mflow-agents-sdk";

const router = express.Router();

// System message defines your agent's capabilities and behavior
const systemMessage = (
  weather: string
) => `You are a specialized AI agent that can answer questions about wheather.

Current weather is: ${weather}`;

router.post(
  "/",
  [
    // Add any validation middleware here
  ],
  async (req, res) => {
    // Extract the message and conversation history
    const { message, previousMessages = [] } = req.body;

    // Implement your agent's logic here
    // This can include:
    // - Processing the request with a language model
    // - Calling external APIs
    // - Accessing databases
    // - Any other specialized functionality

    const weather = "It's sunny today 🌞";

    try {
      // Process the request and stream the response
      const streamingAgent = new StreamingAgent(
        "claude-3-7-sonnet",
        res,
        systemMessage(weather)
      );
      await streamingAgent.run(message, previousMessages);
    } catch (error) {
      console.error(error);
      res.end();
    }
  }
);

export default router;
```

### Message Structure

Your agent will receive messages in this format:

```typescript
type Message = {
  id: string;
  text: string;
  role: "assistant" | "user";
  isFinished?: boolean;
  agentsResponse?: AgentResponse[];
};

type AgentResponse = {
  name: string;
  note: string;
  payload: any;
};
```

## Hosting Your Agent

Your agent endpoint should be:

1. Publicly accessible via HTTPS
2. Reliable with appropriate error handling
3. Capable of handling the expected request volume

You can host your agent on platforms like:

- AWS Lambda + API Gateway
- Vercel
- Render
- Heroku
- Your own server infrastructure

## Registering Your Agent with mflow.dev

Once your agent is deployed, you'll need to register it in the mflow.dev web client:

1. Log in to your mflow.dev account
2. Click "Add Agent"
3. Provide the following information:
   - Agent Name: A unique identifier (e.g., "agent.weather")
   - Description: A brief explanation of your agent's capabilities
   - Endpoint URL: The full URL to your agent's API endpoint

## How the Router Agent Works with Third-Party Agents

The router agent maintains a registry of all available agents, including third-party ones. When processing a user request, it:

1. Analyzes the request to determine which agent is best suited to handle it
2. Selects the appropriate agent based on the request content
3. Forwards the request to the selected agent's endpoint
4. Collects the agent's response
5. Either routes to another agent or returns the final response

## Best Practices

1. Focus on a Specific Task: Your agent should have a well-defined purpose
2. Detailed System Message: Clearly define what your agent can do
3. Error Handling: Implement robust error handling and graceful fallbacks

## Testing Your Agent

Before registering your agent, thoroughly test it in dev/prod environments to ensure:

1. It correctly processes various types of requests
2. It handles edge cases and errors gracefully
3. It returns responses in the expected format

## Conclusion

The mflow.dev platform provides a powerful ecosystem for specialized AI agents to collaborate. By creating and registering your own agent, you can extend the platform's capabilities and provide unique functionality to users.
