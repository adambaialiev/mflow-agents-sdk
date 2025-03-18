import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { Response } from "express";
import { buildMessagesWithAgents } from "../utils/buildMessagesWithAgents";
import { ChatCompletionMessageParam } from "openai/resources/chat";
import { MessageParam, TextBlock } from "@anthropic-ai/sdk/resources/messages";
import Together from "together-ai";
import { CompletionCreateParams } from "together-ai/resources/chat/completions";
import { Message } from "../types";

type SupportedModel =
  | "claude-3-5-sonnet"
  | "claude-3-7-sonnet"
  | "chatgpt-4o"
  | "o3-mini"
  | "deepseek-v3"
  | "deepseek-r1";

type StreamObject = {
  id: string;
  content: string;
  state?: "stop" | "max_tokens";
};

const getErrorToken = (message: string) => `data: [ERROR] ${message}\n\n`;
const getStreamToken = (streamObject: StreamObject) =>
  `data: ${JSON.stringify(streamObject)}\n\n`;
const getDoneToken = () => "data: [DONE]\n\n";

export class StreamingAgent {
  private openai?: OpenAI;
  private anthropic?: Anthropic;
  private together?: Together;
  private model: SupportedModel;
  private res: Response;
  private systemMesage?: string;

  constructor(model: SupportedModel, res: Response, systemMessage?: string) {
    this.model = model;
    this.res = res;
    this.systemMesage = systemMessage;

    // Initialize AI clients

    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }
    if (process.env.TOGETHER_API_KEY) {
      this.together = new Together();
    }
  }

  private setHeaders() {
    // Set up SSE headers
    this.res.setHeader("Content-Type", "text/event-stream");
    this.res.setHeader("Cache-Control", "no-cache");
    this.res.setHeader("Connection", "keep-alive");
    this.res.flushHeaders();
  }

  private getModelString(model: SupportedModel): string {
    switch (model) {
      case "claude-3-5-sonnet":
        return "claude-3-5-sonnet-20241022";
      case "claude-3-7-sonnet":
        return "claude-3-7-sonnet-20250219";
      case "chatgpt-4o":
        return "chatgpt-4o-latest";
      case "o3-mini":
        return "o3-mini-2025-01-31";
      case "deepseek-r1":
        return "deepseek-ai/DeepSeek-R1";
      case "deepseek-v3":
        return "deepseek-ai/DeepSeek-V3";
      default:
        throw new Error(`Unsupported model: ${model}`);
    }
  }

  async run(message: Message, previousMessages: Message[] = []): Promise<void> {
    this.setHeaders();
    try {
      if (
        this.model === "claude-3-5-sonnet" ||
        this.model === "claude-3-7-sonnet"
      ) {
        await this.runAnthropic(message, previousMessages);
      } else if (this.model === "deepseek-r1" || this.model === "deepseek-v3") {
        await this.runTogether(message, previousMessages);
      } else {
        await this.runOpenAI(message, previousMessages);
      }
    } catch (error) {
      console.error(error);
      const e = error as Error;
      this.res.write(getErrorToken(e.message));
      this.res.end();
    }
  }

  private async runOpenAI(
    message: Message,
    previousMessages: Message[]
  ): Promise<void> {
    const messages = buildMessagesWithAgents<ChatCompletionMessageParam>([
      ...previousMessages,
      message,
    ]) as ChatCompletionMessageParam[];

    if (this.systemMesage) {
      messages.unshift({
        role: this.model === "o3-mini" ? "developer" : "system",
        content: this.systemMesage,
      });
    }

    if (!this.openai) {
      throw new Error(
        "Open AI was not initialized because OPENAI_API_KEY was not provided"
      );
    }

    const completion = await this.openai.chat.completions.create({
      messages,
      model: this.getModelString(this.model),
      stream: true,
    });

    const streamId = Date.now().toString();

    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta.content;
      if (content) {
        const streamObject: StreamObject = {
          content,
          id: streamId,
        };
        this.res.write(getStreamToken(streamObject));
      }
      if (chunk.choices[0]?.finish_reason === "length") {
        const streamObject: StreamObject = {
          content: "",
          state: "max_tokens",
          id: streamId,
        };
        this.res.write(getStreamToken(streamObject));
      }
      if (chunk.choices[0]?.finish_reason === "stop") {
        const streamObject: StreamObject = {
          content: "",
          state: "stop",
          id: streamId,
        };
        this.res.write(getStreamToken(streamObject));
      }
    }
    this.res.write(getDoneToken());
    this.res.end();
  }

  private async runTogether(
    message: Message,
    previousMessages: Message[]
  ): Promise<void> {
    const messages = buildMessagesWithAgents<CompletionCreateParams.Message>([
      ...previousMessages,
      message,
    ]) as Array<CompletionCreateParams.Message>;

    if (this.systemMesage) {
      messages.unshift({
        role: "system",
        content: this.systemMesage,
      });
    }

    if (!this.together) {
      throw new Error(
        "Together was not initialized because TOGETHER_API_KEY was not provided"
      );
    }

    const completion = await this.together?.chat.completions.create({
      messages,
      model: this.getModelString(this.model),
      stream: true,
    });

    const streamId = Date.now().toString();

    for await (const chunk of completion) {
      const content = chunk.choices[0]?.delta.content;
      if (content) {
        const streamObject: StreamObject = {
          content,
          id: streamId,
        };
        this.res.write(getStreamToken(streamObject));
      }
      if (chunk.choices[0]?.finish_reason === "length") {
        const streamObject: StreamObject = {
          content: "",
          state: "max_tokens",
          id: streamId,
        };
        this.res.write(getStreamToken(streamObject));
      }
      if (chunk.choices[0]?.finish_reason === "stop") {
        const streamObject: StreamObject = {
          content: "",
          state: "stop",
          id: streamId,
        };
        this.res.write(getStreamToken(streamObject));
      }
    }
    this.res.write(getDoneToken());
    this.res.end();
  }

  private async runAnthropic(
    message: Message,
    previousMessages: Message[]
  ): Promise<void> {
    const messages = buildMessagesWithAgents<MessageParam>([
      ...previousMessages,
      message,
    ]);

    if (!this.anthropic) {
      throw new Error(
        "Anthropic was not initialized because ANTHROPIC_API_KEY was not provided"
      );
    }
    const stream = await this.anthropic.messages.create({
      max_tokens: 8192,
      messages,
      model: this.getModelString(this.model),
      system: this.systemMesage,
      stream: true,
    });

    const streamId = Date.now().toString();

    for await (const messageStreamEvent of stream) {
      if (messageStreamEvent.type === "message_delta") {
        if (messageStreamEvent.delta.stop_reason === "max_tokens") {
          const streamObject: StreamObject = {
            content: "",
            state: "max_tokens",
            id: streamId,
          };
          this.res.write(getStreamToken(streamObject));
        }
      }
      if (messageStreamEvent.type === "content_block_delta") {
        const delta = messageStreamEvent.delta as unknown as TextBlock;
        const streamObject: StreamObject = {
          content: delta.text,
          id: streamId,
        };
        this.res.write(getStreamToken(streamObject));
      }
      if (messageStreamEvent.type === "content_block_stop") {
        const streamObject: StreamObject = {
          content: "",
          state: "stop",
          id: streamId,
        };
        this.res.write(getStreamToken(streamObject));
      }
    }
    this.res.write(getDoneToken());
    this.res.end();
  }
}
