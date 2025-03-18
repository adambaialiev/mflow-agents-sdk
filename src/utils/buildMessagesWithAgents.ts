import { BuildMessagesResult, Message } from "../types";

export const buildMessagesWithAgents = <T>(
  messages: Message[]
): BuildMessagesResult<T> => {
  return messages.map((message) => {
    if (message.role === "assistant") {
      return {
        content: message.text,
        role: message.role,
      };
    }
    return {
      role: message.role,
      content: `<user>
${message.text}
</user>
---
${
  message.agentsResponse
    ? message.agentsResponse
        ?.map(
          (agent) => `<agent name="${agent.name}">
${agent.note}
</agent>`
        )
        .join("\n\n")
    : ""
}
`.trim(),
    };
  }) as BuildMessagesResult<T>;
};

export const buildMessages = <T>(
  messages: Message[]
): BuildMessagesResult<T> => {
  return messages.map((message) => {
    return {
      content: message.text,
      role: message.role,
    };
  }) as BuildMessagesResult<T>;
};
