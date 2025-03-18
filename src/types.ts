export type MessageParam = {
  content: string;
  role: string;
};

export type MessageRole = "assistant" | "user";

export type FileInMessage = {
  path: string;
  content: string;
};

export type AgentResponse = {
  name: string;
  note: string;
  payload: any;
};

export type Message = {
  id: string;
  text: string;
  role: MessageRole;
  isFinished?: boolean;
  agentsResponse?: AgentResponse[];
};

export type BuildMessagesResult<T> = T extends MessageParam ? T[] : never;
